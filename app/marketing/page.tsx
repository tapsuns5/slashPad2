import Header from "./components/header"
import Hero from "./components/hero"
import Features from "./components/features"
import Testimonial from "./components/testimonial"
import Pricing from "./components/pricing"
import FAQ from "./components/faq"
import Footer from "./components/footer"

export default function MarketingPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow">
                <Hero />
                <Features />
                <Testimonial />
                <Pricing />
                <FAQ />
            </main>
            <Footer />
        </div>
    )
}

