"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Menu, Brain, Zap, CheckCircle } from "lucide-react"

export default function ProcessingPage() {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    { icon: Brain, text: "Analizando imagen con IA...", duration: 2000 },
    { icon: Zap, text: "Extrayendo platillos y precios...", duration: 2500 },
    { icon: CheckCircle, text: "Organizando información...", duration: 1500 },
  ]

  useEffect(() => {
    const timeouts: NodeJS.Timeout[] = []
    let totalTime = 0

    steps.forEach((step, index) => {
      const timeout = setTimeout(() => {
        setCurrentStep(index + 1)
      }, totalTime)
      timeouts.push(timeout)
      totalTime += step.duration
    })

    // Redireccionar después de completar todos los pasos
    const finalTimeout = setTimeout(() => {
      window.location.href = "/upload-menu/review"
    }, totalTime + 1000)
    timeouts.push(finalTimeout)

    return () => {
      timeouts.forEach(clearTimeout)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
              <Menu className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">MenuMagic</h1>
          </div>
        </div>

        <Card className="shadow-2xl border-0">
          <CardContent className="p-8 text-center">
            <div className="mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Brain className="w-10 h-10 text-white animate-pulse" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Procesando tu menú</h2>
              <p className="text-gray-600">Nuestra IA está analizando tu imagen y extrayendo la información</p>
            </div>

            {/* Progress steps */}
            <div className="space-y-4">
              {steps.map((step, index) => {
                const StepIcon = step.icon
                const isActive = currentStep === index + 1
                const isCompleted = currentStep > index + 1

                return (
                  <div
                    key={index}
                    className={`flex items-center space-x-3 p-3 rounded-lg transition-all duration-500 ${
                      isActive
                        ? "bg-orange-50 border border-orange-200"
                        : isCompleted
                          ? "bg-green-50 border border-green-200"
                          : "bg-gray-50"
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${
                        isActive
                          ? "bg-gradient-to-r from-orange-500 to-red-500 text-white"
                          : isCompleted
                            ? "bg-green-500 text-white"
                            : "bg-gray-300 text-gray-500"
                      }`}
                    >
                      <StepIcon className={`w-4 h-4 ${isActive ? "animate-pulse" : ""}`} />
                    </div>
                    <span
                      className={`text-sm font-medium transition-colors duration-500 ${
                        isActive ? "text-orange-700" : isCompleted ? "text-green-700" : "text-gray-500"
                      }`}
                    >
                      {step.text}
                    </span>
                    {isActive && (
                      <div className="ml-auto">
                        <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    {isCompleted && (
                      <div className="ml-auto">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Progress bar */}
            <div className="mt-8">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-orange-500 to-red-500 h-2 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${(currentStep / steps.length) * 100}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">{Math.round((currentStep / steps.length) * 100)}% completado</p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Este proceso puede tomar unos segundos dependiendo del tamaño de la imagen</p>
        </div>
      </div>
    </div>
  )
}
