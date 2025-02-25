import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function Testimonial() {
    return (
        <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Trusted by Thousands of Developers</h2>
                        <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                            Don't just take our word for it. Here's what our users have to say about our platform.
                        </p>
                    </div>
                </div>
                <div className="mx-auto max-w-3xl grid gap-8 mt-12">
                    <div className="flex flex-col items-center space-y-2 border rounded-lg p-6 bg-white dark:bg-gray-800">
                        <Avatar className="w-16 h-16">
                            <AvatarImage src="/placeholder.svg" alt="Avatar" />
                            <AvatarFallback>JD</AvatarFallback>
                        </Avatar>
                        <p className="text-xl font-medium">Jane Doe</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">CEO, TechCorp</p>
                        <p className="text-center text-gray-600 dark:text-gray-300">
                            "This platform has revolutionized our development process. It's intuitive, powerful, and has saved us
                            countless hours."
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}

