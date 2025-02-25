import { CheckIcon } from "lucide-react"

export default function Features() {
    return (
        <section className="w-full py-12 md:py-24 lg:py-32 bg-gray-100 dark:bg-gray-800">
            <div className="container px-4 md:px-6">
                <div className="grid items-center gap-6 lg:grid-cols-[1fr_500px] lg:gap-12 xl:grid-cols-[1fr_550px]">
                    <img
                        alt="Image"
                        className="mx-auto aspect-video overflow-hidden rounded-xl object-cover object-center sm:w-full lg:order-last"
                        height="310"
                        src="/placeholder.svg"
                        width="550"
                    />
                    <div className="flex flex-col justify-center space-y-4">
                        <div className="space-y-2">
                            <div className="inline-block rounded-lg bg-gray-100 px-3 py-1 text-sm dark:bg-gray-800">Key Features</div>
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Powerful Features for Your Project</h2>
                            <p className="max-w-[600px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                                Our platform provides everything you need to manage and scale your projects efficiently.
                            </p>
                        </div>
                        <ul className="grid gap-2 py-4">
                            <li className="flex items-center gap-2">
                                <CheckIcon className="h-4 w-4" />
                                <span className="font-medium">Automated Workflows</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckIcon className="h-4 w-4" />
                                <span className="font-medium">Real-time Collaboration</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <CheckIcon className="h-4 w-4" />
                                <span className="font-medium">Advanced Analytics</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    )
}

