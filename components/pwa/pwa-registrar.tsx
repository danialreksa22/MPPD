"use client"

import { useEffect } from "react"

export function PwaRegistrar() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // Service worker registered
          reg.onupdatefound = () => {
            const installingWorker = reg.installing
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === "installed" && navigator.serviceWorker.controller) {
                  console.log("PWA: Versi baru MAGGURU tersedia.")
                }
              }
            }
          }
        })
        .catch((err) => {
          console.warn("PWA: Gagal mendaftarkan service worker", err)
        })
    }
  }, [])

  return null
}
