import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export default function FAQ() {
    const faqs = [
        {
            question: "What is Acme Inc?",
            answer: "Acme Inc is a platform that helps teams manage their development workflows efficiently.",
        },
        {
            question: "How does pricing work?",
            answer: "We offer tiered pricing plans to suit teams of all sizes. Check out our pricing page for more details.",
        },
        {
            question: "Is there a free trial?",
            answer: "Yes, we offer a 14-day free trial for all our plans. No credit card required.",
        },
    ]

    return (
        <section className="w-full py-12 md:py-24 lg:py-32">
            <div className="container px-4 md:px-6">
                <div className="flex flex-col items-center justify-center space-y-4 text-center">
                    <div className="space-y-2">
                        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Frequently Asked Questions</h2>
                        <p className="max-w-[900px] text-gray-500 md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed dark:text-gray-400">
                            Find answers to common questions about our platform.
                        </p>
                    </div>
                </div>
                <div className="mx-auto max-w-3xl mt-8">
                    <Accordion type="single" collapsible className="w-full">
                        {faqs.map((faq, index) => (
                            <AccordionItem key={index} value={`item-${index}`}>
                                <AccordionTrigger>{faq.question}</AccordionTrigger>
                                <AccordionContent>{faq.answer}</AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>
                </div>
            </div>
        </section>
    )
}

