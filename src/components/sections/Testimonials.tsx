import Image from 'next/image'

export default function Testimonials() {
  return (
    <section className="bg-gray-50 py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          <p className="font-sans text-xs sm:text-sm md:text-base font-medium uppercase tracking-wide mb-3 sm:mb-4">
            <span className="bg-[#F8E8D8] px-2 py-0 rounded-lg text-[#0C1628]">TESTIMONIALS</span>
          </p>
          <h2 className="font-cooper text-2xl sm:text-3xl md:text-4xl lg:text-4xl font-normal leading-tight text-[#0C1628] mb-6 sm:mb-8">
            What Our Participants Say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-8">
          {/* Testimonial 1 */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-sm border border-gray-100 flex flex-col h-full">
            <div className="flex items-center mb-4 sm:mb-5 lg:mb-6">
              <div className="relative w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full overflow-hidden mr-3 sm:mr-4 flex-shrink-0">
                <Image
                  src="/images/testimonial-james.webp"
                  alt="Jennie Richards"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="font-sans font-semibold text-base sm:text-lg text-gray-900">
                  James
                </h3>
                <p className="font-sans text-sm sm:text-base text-gray-500">
                  NDIS Participant
                </p>
              </div>
            </div>
            <p className="font-sans text-sm sm:text-base text-gray-700 leading-relaxed italic">
              " When I first thought about changing providers, I was nervous. I wasn’t sure if a new Support Worker would understand me or fit into my routine. But from the beginning, Remonta really listened to what I needed. They introduced me to Anthony, and honestly, it felt like the perfect match. He respects my choices, understands my habits, and supports me without ever making me feel uncomfortable. Now, I feel like I finally have the right support to live life my way. "
            </p>
          </div>

          {/* Testimonial 2 */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-sm border border-gray-100 flex flex-col h-full">
            <div className="flex items-center mb-4 sm:mb-5 lg:mb-6">
              <div className="relative w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full overflow-hidden mr-3 sm:mr-4 flex-shrink-0">
                <Image
                  src="/images/testimonial-rachel.webp"
                  alt="Dillon Brooks"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="font-sans font-semibold text-base sm:text-lg text-gray-900">
                  Rachel
                </h3>
                <p className="font-sans text-sm sm:text-base text-gray-500">
                  NDIS Participant
                </p>
              </div>
            </div>
            <p className="font-sans text-sm sm:text-base text-gray-700 leading-relaxed italic">
              " Living with anxiety made me hesitant to reach out for help. But with Chloe from Remonta, I’ve found someone who makes me feel calm and supported. She’s more than a Support Worker, she's someone who makes me feel seen and valued. Because of her, I’ve started exploring new hobbies and meeting new people. "
            </p>
          </div>

          {/* Testimonial 3 */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-sm border border-gray-100 flex flex-col h-full">
            <div className="flex items-center mb-4 sm:mb-5 lg:mb-6">
              <div className="relative w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full overflow-hidden mr-3 sm:mr-4 flex-shrink-0">
                <Image
                  src="/images/testimonial-sarah.webp"
                  alt="Tom Roberts"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="font-sans font-semibold text-base sm:text-lg text-gray-900">
                  Sarah
                </h3>
                <p className="font-sans text-sm sm:text-base text-gray-500">
                  NDIS Participant
                </p>
              </div>
            </div>
            <p className="font-sans text-sm sm:text-base text-gray-700 leading-relaxed italic">
              " Before I met Alice from Remonta, I was really struggling to manage on my own. Simple things like cooking or keeping my space organised felt overwhelming. Alice didn’t just step in to do things for me; she encouraged me to try, guided me with patience, and reminded me that I could do more than I thought. Over time, I started becoming more independent, and now I feel so much more confident in myself. She’s more than a Support Worker, she's someone who believes in me. "
            </p>
          </div>

          {/* Testimonial 4 */}
          <div className="bg-white rounded-xl sm:rounded-2xl p-5 sm:p-6 lg:p-8 shadow-sm border border-gray-100 flex flex-col h-full">
            <div className="flex items-center mb-4 sm:mb-5 lg:mb-6">
              <div className="relative w-11 h-11 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full overflow-hidden mr-3 sm:mr-4 flex-shrink-0">
                <Image
                  src="/images/testimonial-david.webp"
                  alt="Ana Finley"
                  fill
                  className="object-cover"
                />
              </div>
              <div>
                <h3 className="font-sans font-semibold text-base sm:text-lg text-gray-900">
                 David
                </h3>
                <p className="font-sans text-sm sm:text-base text-gray-500">
                  Head of Marketing at Webflow
                </p>
              </div>
            </div>
            <p className="font-sans text-sm sm:text-base text-gray-700 leading-relaxed italic">
              " After an accident, I had to completely adjust to a new way of living. Remonta has been with me every step of the way. My Support Worker, Mark, not only helps with my physical needs but also gives me the confidence to stay positive about the future. With his support, I feel like I can take on life again. "
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}