/**
 * RSUD H. Andi Sulthan Daeng Radja Bulukumba — WebAuthn Platform Biometrics
 * Memanfaatkan sensor biometrik bawaan HP mahasiswa (Fingerprint / Face ID / Touch ID)
 * melalui W3C Web Authentication API.
 */

export interface BiometricCheckSupportResult {
  isSupported: boolean
  hasPlatformAuthenticator: boolean
  biometricType: "fingerprint_or_faceid" | "none"
  message: string
}

export interface BiometricAuthResult {
  success: boolean
  method: "biometric_fingerprint" | "biometric_faceid" | "camera_selfie"
  credentialId?: string
  message: string
  error?: string
}

/**
 * Memeriksa apakah perangkat ponsel mendukung sensor biometrik (Fingerprint / Face ID)
 */
export async function checkPlatformBiometricsSupport(): Promise<BiometricCheckSupportResult> {
  if (typeof window === "undefined") {
    return {
      isSupported: false,
      hasPlatformAuthenticator: false,
      biometricType: "none",
      message: "Tidak berjalan di lingkungan browser.",
    }
  }

  if (!window.PublicKeyCredential) {
    return {
      isSupported: false,
      hasPlatformAuthenticator: false,
      biometricType: "none",
      message: "Browser ini belum mendukung Web Authentication API.",
    }
  }

  try {
    const hasPlatform =
      await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()

    if (hasPlatform) {
      return {
        isSupported: true,
        hasPlatformAuthenticator: true,
        biometricType: "fingerprint_or_faceid",
        message: "Sensor Biometrik HP (Fingerprint / Face ID) tersedia dan aktif.",
      }
    } else {
      return {
        isSupported: true,
        hasPlatformAuthenticator: false,
        biometricType: "none",
        message:
          "Perangkat tidak memiliki sensor biometrik aktif atau belum mendaftarkan sidik jari/Face ID.",
      }
    }
  } catch (err: unknown) {
    return {
      isSupported: false,
      hasPlatformAuthenticator: false,
      biometricType: "none",
      message: err instanceof Error ? err.message : "Gagal memeriksa sensor biometrik.",
    }
  }
}

/**
 * Memicu verifikasi sensor biometrik native pada HP mahasiswa (Fingerprint / Face ID)
 */
export async function authenticatePlatformBiometrics(
  studentNim: string,
  studentName: string
): Promise<BiometricAuthResult> {
  if (typeof window === "undefined" || !window.navigator.credentials) {
    return {
      success: false,
      method: "biometric_fingerprint",
      message: "Fitur Web Authentication tidak tersedia di perangkat ini.",
      error: "WEBAUTHN_NOT_AVAILABLE",
    }
  }

  try {
    const challenge = new Uint8Array(32)
    window.crypto.getRandomValues(challenge)

    const userId = new TextEncoder().encode(studentNim || "mppd-student")

    // Minta verifikasi biometrik platform (Touch ID, Face ID, atau Fingerprint Android)
    const credential = (await window.navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: "MAGGURU RSUD Bulukumba",
          id: window.location.hostname,
        },
        user: {
          id: userId,
          name: studentNim || "mahasiswa",
          displayName: studentName || "Mahasiswa Praktik",
        },
        pubKeyCredParams: [
          { alg: -7, type: "public-key" }, // ES256
          { alg: -257, type: "public-key" }, // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: "platform", // Wajib menggunakan sensor internal HP
          userVerification: "required", // Wajib sidik jari / pemindaian wajah
          residentKey: "preferred",
        },
        timeout: 60000,
        attestation: "none",
      },
    })) as PublicKeyCredential | null

    if (!credential) {
      return {
        success: false,
        method: "biometric_fingerprint",
        message: "Verifikasi biometrik tidak menghasilkan kredensial.",
        error: "NO_CREDENTIAL",
      }
    }

    return {
      success: true,
      method: "biometric_fingerprint",
      credentialId: credential.id,
      message: "Verifikasi biometrik ponsel (Fingerprint/Face ID) berhasil divalidasi!",
    }
  } catch (err: unknown) {
    const errorName = (err as Error)?.name || ""

    if (errorName === "NotAllowedError") {
      return {
        success: false,
        method: "biometric_fingerprint",
        message: "Verifikasi biometrik dibatalkan oleh pengguna atau waktu habis.",
        error: "USER_CANCELLED",
      }
    }

    if (errorName === "NotSupportedError") {
      return {
        success: false,
        method: "biometric_fingerprint",
        message: "Sensor biometrik platform tidak didukung oleh browser ini.",
        error: "NOT_SUPPORTED",
      }
    }

    return {
      success: false,
      method: "biometric_fingerprint",
      message: (err as Error)?.message || "Gagal memproses verifikasi biometrik.",
      error: String(err),
    }
  }
}
