import { Button } from "@/components/ui/button"
import { CheckIcon } from "lucide-react"

export default function Pricing() {
    return (
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Simple, Transparent Pricing</h2>
                        <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                            Choose the plan that's right for you and your team.
                        </p>
                    </div>
                </div>
                <div className="grid gap-6 mt-12 md:grid-cols-2 lg:grid-cols-3">
                    {["Starter", "Pro", "Enterprise"].map((plan) => (
                        <div
                            key={plan}
                            className="flex flex-col p-6 bg-white shadow-lg rounded-lg dark:bg-gray-850 justify-between"
                        >
                            <div>
                                <h3 className="text-2xl font-bold text-center">{plan}</h3>
                                <div className="mt-4 text-center text-gray-600 dark:text-gray-400">
                                    <span className="text-4xl font-bold">$29</span> / month
                                </div>
                                <ul className="mt-4 space-y-2">
                                    {["5 Projects", "5GB Storage", "Up to 10 users"].map((feature) => (
                                        <li key={feature} className="flex items-center">
                                            <CheckIcon className="text-green-500 mr-2 h-5 w-5" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <Button className="mt-6">Get Started</Button>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

