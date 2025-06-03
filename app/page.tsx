import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { redirect } from "next/navigation"
import {
  Camera,
  Smartphone,
  Zap,
  Star,
  CheckCircle,
  ArrowRight,
  Menu,
  Wifi,
  PrinterIcon,
  DollarSign,
  Quote,
} from "lucide-react"

export default function Home() {
  redirect("/dashboard")
}

function MenuMagicLanding() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
              <Menu className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">MenuMagic</span>
          </div>
          <Button variant="outline" size="sm">
            Iniciar Sesión
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 lg:py-32 bg-gradient-to-br from-orange-50 to-red-50">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">
                  🎉 Completamente gratis, siempre!
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Morderniza tu Restaurante,{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500">
                    Rapido y Gratis
                  </span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Todas las herramientas que tu resturante necesita. Menu fisico y digital. Codigos QR, tarjetas NFC,
                  pagina web, ordenes en linea y mucho mas!
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white px-8 py-4 text-lg"
                >
                  Quiero registrar mi restaurante
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                  Ver Demo
                </Button>
              </div>

              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Sin tarjeta de crédito</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span>Configuración en 5 minutos</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10">
                <img
                  src="/placeholder.svg?height=600&width=500"
                  alt="Panel de MenuMagic mostrando carga de menú con IA y creación de menú digital"
                  className="w-full h-auto rounded-2xl shadow-2xl"
                />
              </div>
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-r from-orange-400 to-red-400 rounded-full opacity-20"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-r from-red-400 to-orange-400 rounded-full opacity-20"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Todo lo que tu restaurante necesita</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Una solución completa para modernizar tu restaurante con herramientas digitales y físicas
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Menú Digital Dinámico */}
            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 group cursor-pointer h-full">
              <CardContent className="p-8 h-full flex flex-col">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:from-blue-600 group-hover:to-cyan-600 transition-all duration-300">
                  <Smartphone className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center group-hover:text-blue-600 transition-colors duration-300">
                  Menú Digital
                </h3>
                <p className="text-gray-600 text-center flex-grow group-hover:text-gray-700 transition-colors duration-300">
                  Moderniza la experiencia del cliente con un menú elegante, interactivo y accesible desde cualquier
                  smartphone. Actualiza platillos, precios y descripciones al instante, sin complicaciones.
                </p>
              </CardContent>
            </Card>

            {/* Menú Físico Profesional */}
            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 group cursor-pointer h-full">
              <CardContent className="p-8 h-full flex flex-col">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:from-green-600 group-hover:to-emerald-600 transition-all duration-300">
                  <PrinterIcon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center group-hover:text-green-600 transition-colors duration-300">
                  Menú Físico
                </h3>
                <p className="text-gray-600 text-center flex-grow group-hover:text-gray-700 transition-colors duration-300">
                  Complementa tu estrategia digital con menús impresos de alta calidad. Diseñados profesionalmente
                  basándose en tu versión digital, garantizando coherencia y una presentación impecable.
                </p>
                <div className="mt-4 text-center">
                  <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50">
                    Plantillas faciles y gratis
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Códigos QR Personalizados */}
            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 group cursor-pointer h-full">
              <CardContent className="p-8 h-full flex flex-col">
                <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-violet-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:from-purple-600 group-hover:to-violet-600 transition-all duration-300">
                  <Camera className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center group-hover:text-purple-600 transition-colors duration-300">
                  Códigos QR
                </h3>
                <p className="text-gray-600 text-center flex-grow group-hover:text-gray-700 transition-colors duration-300">
                  Facilita el acceso a tu menú digital con un simple escaneo. Genera códigos únicos para cada mesa o
                  punto de contacto, ofreciendo una interacción sin contacto y eficiente.
                </p>
              </CardContent>
            </Card>

            {/* Tu Página Web de Menú */}
            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 group cursor-pointer h-full">
              <CardContent className="p-8 h-full flex flex-col">
                <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:from-orange-600 group-hover:to-red-600 transition-all duration-300">
                  <Wifi className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center group-hover:text-orange-600 transition-colors duration-300">
                  Página Web (Proximamente)
                </h3>
                <p className="text-gray-600 text-center flex-grow group-hover:text-gray-700 transition-colors duration-300">
                  Obtén una presencia online sencilla y profesional. Tu menú digital se aloja en una URL dedicada para
                  tu restaurante, lista para compartir en redes sociales y en cualquier parte.
                </p>
              </CardContent>
            </Card>

            {/* Facturación (Próximamente) */}
            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 group cursor-pointer h-full">
              <CardContent className="p-8 h-full flex flex-col">
                <div className="w-16 h-16 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:from-yellow-600 group-hover:to-amber-600 transition-all duration-300">
                  <DollarSign className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center group-hover:text-yellow-600 transition-colors duration-300">
                  Facturación
                </h3>
                <p className="text-gray-600 text-center flex-grow group-hover:text-gray-700 transition-colors duration-300">
                  Estamos trabajando para integrar herramientas de facturación que simplificarán aún más tus
                  operaciones. ¡Próximamente para una gestión aún más completa!
                </p>
                <div className="mt-4 text-center">
                  <Badge variant="outline" className="text-yellow-600 border-yellow-200 bg-yellow-50">
                    Próximamente
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Tarjetas NFC */}
            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 group cursor-pointer h-full">
              <CardContent className="p-8 h-full flex flex-col">
                <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:from-indigo-600 group-hover:to-blue-600 transition-all duration-300">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4 text-center group-hover:text-indigo-600 transition-colors duration-300">
                  Tarjetas NFC (Tap-to-View)
                </h3>
                <p className="text-gray-600 text-center flex-grow group-hover:text-gray-700 transition-colors duration-300">
                  La forma más moderna de presentar tu menú. Tus clientes solo tienen que tocar la tarjeta con su
                  smartphone para ver el menú al instante, una experiencia futurista y sin fricciones.
                </p>
                <div className="mt-4 text-center">
                  <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50">
                    5 Gratis + Complementos
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Cómo Funciona MenuMagic</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Ten tu sistema de menú moderno funcionando en solo 4 pasos simples
            </p>
          </div>

          <div className="grid lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Camera className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-bold">1</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Fotografía y Sube</h3>
              <p className="text-gray-600">
                Toma una foto de tu menú actual. Nuestra IA extrae inteligentemente todos los platillos, descripciones y
                precios.
              </p>
            </div>

            <div className="text-center">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Smartphone className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-bold">2</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Personaliza tu Menú</h3>
              <p className="text-gray-600">
                Revisa y personaliza fácilmente tu hermoso menú digital optimizado para móviles. Elige entre plantillas
                elegantes.
              </p>
            </div>

            <div className="text-center">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Wifi className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-bold">3</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Publica y Comparte</h3>
              <p className="text-gray-600">
                Obtén tu código QR único y enlace. Opta por tarjetas NFC para conveniencia de toque y visualización en
                las mesas.
              </p>
            </div>

            <div className="text-center">
              <div className="relative mb-8">
                <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <PrinterIcon className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-bold">4</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Obtén Menús Físicos</h3>
              <p className="text-gray-600">
                <span className="text-orange-600 font-semibold">Opcional:</span> ¿Necesitas menús impresos? Diseñaremos
                y entregaremos basados en tu versión digital.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Confiado por Dueños de Restaurantes en Todas Partes
            </h2>
            <div className="flex items-center justify-center space-x-8 mb-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500">2,500+</div>
                <div className="text-gray-600">Restaurantes Atendidos</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500">50,000+</div>
                <div className="text-gray-600">Menús Creados</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-500">4.9/5</div>
                <div className="text-gray-600">Calificación de Clientes</div>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-orange-500 mb-4" />
                <p className="text-gray-600 mb-6">
                  MenuMagic transformó cómo manejamos los menús! La carga con IA nos ahorró muchísimo tiempo, y a
                  nuestros clientes les encantan las tarjetas NFC. Es tan moderno y profesional.
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                  <div>
                    <div className="font-semibold text-gray-900">María González</div>
                    <div className="text-gray-600">Propietaria, Bistro Bella Vista</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-orange-500 mb-4" />
                <p className="text-gray-600 mb-6">
                  Como dueño de una cafetería ocupada, no tengo tiempo para tecnología complicada. MenuMagic hizo
                  increíblemente fácil volverse digital. El servicio gratuito es increíble!
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                  <div>
                    <div className="font-semibold text-gray-900">Carlos Rodríguez</div>
                    <div className="text-gray-600">Gerente, Café de la Esquina</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="flex items-center mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <Quote className="w-8 h-8 text-orange-500 mb-4" />
                <p className="text-gray-600 mb-6">
                  La experiencia sin contacto que nuestros clientes obtienen con MenuMagic es exactamente lo que
                  necesitábamos después de la pandemia. La configuración fue increíblemente simple.
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-200 rounded-full mr-4"></div>
                  <div>
                    <div className="font-semibold text-gray-900">Ana López</div>
                    <div className="text-gray-600">Propietaria, Sabores Urbanos</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Precios Simples y Transparentes</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comienza completamente gratis con nuestras funciones principales. Agrega servicios premium solo cuando los
              necesites.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-2 border-orange-200 shadow-xl relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-2">Más Popular</Badge>
              </div>
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Plan Principal</h3>
                  <div className="text-5xl font-bold text-gray-900 mb-2">GRATIS</div>
                  <p className="text-gray-600">Para siempre, sin costos ocultos</p>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Carga de menú con IA</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Hermoso menú digital</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Código QR y enlace compartible</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>5 tarjetas NFC gratis</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Actualizaciones ilimitadas del menú</span>
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                    <span>Diseño responsivo para móviles</span>
                  </li>
                </ul>

                <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white py-3">
                  Comenzar Gratis
                </Button>
              </CardContent>
            </Card>

            <Card className="border shadow-lg">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Complementos Pro</h3>
                  <div className="text-2xl font-bold text-gray-900 mb-2">Paga según necesites</div>
                  <p className="text-gray-600">Servicios premium opcionales</p>
                </div>

                <ul className="space-y-4 mb-8">
                  <li className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      <span>Impresión de menús físicos</span>
                    </div>
                    <span className="text-gray-600">Desde $29</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      <span>Tarjetas NFC adicionales</span>
                    </div>
                    <span className="text-gray-600">$3 cada una</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      <span>Marca personalizada</span>
                    </div>
                    <span className="text-gray-600">$19/mes</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      <span>Panel de analíticas</span>
                    </div>
                    <span className="text-gray-600">$9/mes</span>
                  </li>
                  <li className="flex items-center justify-between">
                    <div className="flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
                      <span>Soporte prioritario</span>
                    </div>
                    <span className="text-gray-600">$15/mes</span>
                  </li>
                </ul>

                <Button variant="outline" className="w-full py-3">
                  Saber Más
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-gradient-to-r from-orange-500 to-red-500">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">¿Listo para Modernizar tu Menú Gratis?</h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Únete a miles de restaurantes que ya usan MenuMagic para optimizar sus operaciones e impresionar a sus
            clientes.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-orange-600 hover:bg-gray-100 px-8 py-4 text-lg"
            >
              ¡Regístrate y Comienza (Es Gratis!)
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-white text-white hover:bg-white hover:text-orange-600 px-8 py-4 text-lg"
            >
              Ver Video Demo
            </Button>
          </div>

          <div className="flex items-center justify-center space-x-6 mt-8 text-orange-100">
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-4 h-4" />
              <span>Sin tarjeta de crédito</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-4 h-4" />
              <span>Configuración en 5 minutos</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-4 h-4" />
              <span>Cancela cuando quieras</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <Menu className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">MenuMagic</span>
              </div>
              <p className="text-gray-400 mb-4">
                La forma más fácil de crear, gestionar y mostrar menús modernos para restaurantes.
              </p>
              <div className="text-gray-400">© 2024 MenuMagic. Todos los derechos reservados.</div>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Características
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Precios
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Demo
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Preguntas Frecuentes
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Soporte</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Centro de Ayuda
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Contáctanos
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Guía de Configuración
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Video Tutoriales
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Política de Privacidad
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Términos de Servicio
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Política de Cookies
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    GDPR
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
