"use client";

import Image from "next/image";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { useState, useEffect } from "react";

export default function HomePage() {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    // Set the target date - 24 hours from now
    const targetDate = new Date();
    targetDate.setHours(targetDate.getHours() + 24);

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate.getTime() - now;

      if (distance < 0) {
        setTimeLeft("Offer Expired");
        return;
      }

      const hours = Math.floor(distance / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Updated to match the image */}
      <section className="relative py-0 min-h-screen flex items-center justify-center bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-center w-full max-w-6xl mx-auto min-h-screen">
            <div className="text-center md:text-left md:w-1/2 p-4">
              <h1 className="text-left text-4xl md:text-5xl lg:text-6xl font-bold text-black mb-4 leading-tight">
                Ingin Gaji Dua Digit dan Kerja dari Mana Saja?
              </h1>
              <h2 className="text-left text-2xl md:text-3xl lg:text-4xl font-bold text-pink-600 mb-6">
                Ini Kesempatanmu!
              </h2>
              <p className="text-left text-lg md:text-xl text-black mb-8 leading-relaxed">
                Dengan pengalaman dan strategi yang terbukti, aku siap bantu
                kamu meraih pekerjaan remote impianmu!
              </p>
              <Link
                href="#paketKursus"
                className="bg-pink-700 text-white text-lg font-semibold py-4 px-8 rounded-full hover:bg-pink-800 transition duration-300 inline-block shadow-lg"
              >
                TAKE ACTION SEKARANG
              </Link>
            </div>
            <div className="md:w-1/2 flex justify-center items-center">
              <Image
                src="/2789bdfe15e51a219051122cd1bcf9d2786c73ba_s2_n3_y2.png"
                alt="Peni - Remote Work Expert"
                width={500}
                height={600}
                className="pointer-events-none select-none object-contain max-w-full h-auto"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* Three Signs Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-center text-2xl md:text-3xl font-bold text-pink-700 mb-12">
            3 Tanda Kalau Sekarang Sudah Saatnya Kamu Coba Kerja Remote di
            Bidang Digital Marketing!!
          </h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {threeSignsData.map((sign, index) => (
              <div
                key={index}
                className="bg-pink-100 rounded-lg p-6 shadow-lg hover:transform hover:-translate-y-2 transition-all duration-300"
              >
                <div className="text-center mb-4">
                  <Image
                    src={sign.icon}
                    alt={sign.title}
                    width={50}
                    height={50}
                    className="mx-auto"
                  />
                </div>
                <h3 className="text-lg font-bold text-pink-700 mb-3">
                  {sign.title}
                </h3>
                <p className="text-gray-700">{sign.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-1/3">
              <h2 className="text-2xl md:text-3xl font-bold text-pink-700 mb-6">
                Apa yang Bisa Kamu Dapatkan dengan Mengikuti Kursus Ini?
              </h2>
            </div>
            <div className="lg:w-2/3 bg-pink-100 rounded-lg p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {benefitsData.map((benefit, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg p-4 shadow-md hover:transform hover:-translate-y-2 transition-all duration-300"
                  >
                    <div className="text-2xl mb-3">{benefit.icon}</div>
                    <h3 className="text-lg font-bold text-gray-800 mb-2">
                      {benefit.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {benefit.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Peni Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-center text-2xl md:text-3xl font-bold text-pink-700 mb-8">
            Kenalan dulu yuk!
          </h1>
          <div className="text-center mb-12">
            <p className="text-lg text-gray-700 max-w-4xl mx-auto">
              Haii, perkenalkan namaku Peni. Aku memiliki pengalaman bekerja
              dengan perusahaan-perusahaan di luar negeri secara remote dan
              hybrid, seperti Edudrift (Singapore), Alem Health (Singapore),
              Quizlet (USA), Stalinks (Hong Kong) dan berkolaborasi dengan
              Samsung, Glints, EF, MySkill.
            </p>
          </div>

          {/* Work Experience */}
          <div className="mb-12">
            <h2 className="text-xl font-bold text-pink-700 text-center mb-8">
              Pengalaman Kerja
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {workExperienceData.map((company, index) => (
                <div key={index} className="text-center">
                  <div className="mb-3">
                    <Image
                      src={company.logo}
                      alt={`${company.name} Logo`}
                      width={80}
                      height={80}
                      className="mx-auto object-contain hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="mb-2">
                    <Image
                      src={company.flag}
                      alt={`${company.country} Flag`}
                      width={32}
                      height={20}
                      className="mx-auto"
                    />
                  </div>
                  <p className="text-sm text-pink-700 font-medium">
                    {company.name}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Collaboration */}
          <div className="mb-12">
            <h2 className="text-xl font-bold text-pink-700 text-center mb-8">
              Kolaborasi
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {collaborationData.map((company, index) => (
                <div key={index} className="text-center">
                  <div className="mb-3">
                    <Image
                      src={company.logo}
                      alt={`${company.name} Logo`}
                      width={80}
                      height={80}
                      className="mx-auto object-contain hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <div className="mb-2">
                    <Image
                      src={company.flag}
                      alt={`${company.country} Flag`}
                      width={32}
                      height={20}
                      className="mx-auto"
                    />
                  </div>
                  <p className="text-sm text-pink-700 font-medium">
                    {company.name}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Photos */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-pink-700 mb-8">
              Aku udah merasakan enak nya kerja remote, sekarang giliran kamu!
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {remoteWorkPhotos.map((photo, index) => (
                <div key={index} className="relative">
                  <Image
                    src={photo}
                    alt="Peni bekerja remote"
                    width={300}
                    height={200}
                    className="rounded-lg shadow-lg hover:scale-105 transition-transform duration-300 w-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-center text-2xl md:text-3xl font-bold text-gray-800 mb-12">
            Bagaimana Cara Kerja Kursus Ini?
          </h1>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {howItWorksData.map((step, index) => (
                <div
                  key={index}
                  className="bg-gray-50 rounded-lg p-6 hover:transform hover:-translate-y-2 transition-all duration-300 shadow-md"
                >
                  <h3 className="text-lg font-bold text-pink-700 mb-3">
                    {step.title}
                  </h3>
                  <div className="text-gray-600">
                    {step.description.map((desc, idx) => (
                      <p key={idx} className="mb-2">
                        {desc}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center mt-8">
              <Link
                href="#paketKursus"
                className="bg-pink-700 text-white py-3 px-8 rounded-full text-lg font-semibold hover:bg-pink-800 transition-colors duration-300"
              >
                Take Action Sekarang
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="paketKursus" className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-center text-2xl md:text-3xl font-bold text-pink-700 mb-12">
            Pilihan Paket Kursus
          </h1>
          <div className="flex justify-center">
            <div className="relative bg-pink-100 rounded-lg p-8 shadow-xl max-w-4xl w-full border-2 border-pink-700">
              <div className="absolute top-0 right-0 bg-pink-700 text-white px-4 py-1 rounded-bl-lg text-sm font-bold">
                Exclusive for this month only!
              </div>
              <h2 className="text-2xl font-bold text-pink-700 mb-4">
                Full Complete Package
              </h2>
              <div className="text-center mb-6">
                <span className="block text-gray-500 line-through text-lg">
                  Rp 1.999.000
                </span>
                <span className="block text-3xl font-bold text-pink-700">
                  Rp 399.000
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    Course Content:
                  </h3>
                  <ul className="space-y-2">
                    {courseContentData.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-pink-700 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-800 mb-4">
                    Templates & Resources:
                  </h3>
                  <ul className="space-y-2">
                    {templatesData.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-pink-700 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="bg-pink-700 text-white rounded-lg p-6 mb-8">
                <h3 className="text-lg font-bold mb-3">Bonus:</h3>
                <ul className="space-y-2">
                  {bonusData.map((item, index) => (
                    <li key={index} className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="text-center">
                <Link
                  href="/pembayaran?courseId=cmdy0xvzm0001mrw5oga3jd6f"
                  className="bg-pink-700 text-white py-4 px-8 rounded-lg text-xl font-bold hover:bg-pink-800 transition-colors duration-300 inline-block"
                >
                  Belajar Sekarang
                </Link>
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">Offer ends in:</p>
                  <div
                    id="countdown"
                    className="text-lg font-bold text-pink-700"
                  >
                    {timeLeft || "Loading..."}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-pink-100">
        <div className="container mx-auto px-4 max-w-6xl">
          <h2 className="text-center text-2xl md:text-3xl font-bold text-pink-700 mb-12">
            Alumni Success Story
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {testimonialImages.map((image, index) => (
              <div key={index} className="text-center">
                <Image
                  src={image}
                  alt={`Testimonial ${index + 1}`}
                  width={250}
                  height={300}
                  className="rounded-lg shadow-lg w-full h-auto"
                />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <h2 className="text-center text-2xl md:text-3xl font-bold text-pink-700 mb-12">
            FAQ
          </h2>
          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 bg-pink-100">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-pink-700 mb-4">
            Contact or Support
          </h2>
          <p className="text-lg text-gray-700 mb-4">
            Masih ada pertanyaan yang belum terjawab? Hubungi admin Triska untuk
            bantuan lebih lanjut!
          </p>
          <p className="text-lg font-semibold text-gray-800 mb-6">
            Contact Support: +62 878 6334 2502
          </p>
          <p className="text-lg font-semibold text-gray-800 mb-6">
            Email: penirizki5@gmail.com
          </p>
          <p className="text-lg font-semibold text-gray-800 mb-6">
            Alamat: Jl. Gunung Soputan, Kelurahan Pemecutan Kelod, Kecamatan
            Denpasar Barat, Kota Denpasar.
          </p>
          <Link
            href="https://wa.me/6287863342502"
            target="_blank"
            className="bg-green-500 text-white py-3 px-8 rounded-lg text-lg font-semibold hover:bg-green-600 transition-colors duration-300 inline-block"
          >
            Hubungi via WhatsApp
          </Link>
        </div>
      </section>
    </div>
  );
}

// FAQ Component
function FAQItem({ question, answer }: { question: string; answer: string }) {
  return (
    <details className="group">
      <summary className="flex justify-between items-center cursor-pointer bg-pink-700 text-white p-4 rounded-lg hover:bg-pink-800 transition-colors duration-300">
        <span className="font-semibold">{question}</span>
        <span className="transform group-open:rotate-180 transition-transform duration-300">
          ▼
        </span>
      </summary>
      <div className="mt-2 p-4 bg-white border border-pink-700 rounded-lg">
        <p className="text-gray-700">{answer}</p>
      </div>
    </details>
  );
}

// Data arrays
const threeSignsData = [
  {
    icon: "https://cdn-icons-png.freepik.com/512/2228/2228204.png?uid=R168537370&ga=GA1.1.230186156.1719331155",
    title: "Capek Kerja Pulang-Pergi?",
    description:
      "Pulang-pergi dan macet berjam-jam bikin lelah? Ini saatnya beralih ke kerja remote dan bebas dari stress di jalan!",
  },
  {
    icon: "https://cdn-icons-png.freepik.com/512/5115/5115997.png?uid=R168537370&ga=GA1.1.230186156.1719331155",
    title: "Sulit Dapetin Work-Life Balance?",
    description:
      "Kerja remote memberikan kamu fleksibilitas waktu untuk mengatur kehidupan pribadi dan pekerjaan jadi lebih seimbang.",
  },
  {
    icon: "https://cdn-icons-png.freepik.com/512/1589/1589592.png?uid=R168537370&ga=GA1.1.230186156.1719331155",
    title: "Karir Terasa Stuck?",
    description:
      "Bekerja di dunia digital marketing secara remote membuka peluang lebih besar untuk berkembang dan meningkatkan karir secara global.",
  },
];

const benefitsData = [
  {
    icon: "📜",
    title: "Sertifikat Bertaraf Internasional",
    description:
      "Pelajari tentang sertifikat digital marketing yang diakui secara internasional dan berharga di dunia kerja!",
  },
  {
    icon: "🌍",
    title: "Kesempatan Magang Remote",
    description:
      "Dapatkan informasi eksklusif tentang peluang magang remote di perusahaan luar negeri!",
  },
  {
    icon: "💬",
    title: "Akses Komunitas Eksklusif",
    description:
      "Akses eksklusif ke komunitas Discord dengan info loker remote mingguan.",
  },
  {
    icon: "📚",
    title: "Materi Terbukti",
    description:
      "Materi kursus yang sudah terbukti membantu mendapatkan pekerjaan remote bergaji dua digit.",
  },
  {
    icon: "📝",
    title: "Template CV & Portofolio",
    description:
      "Template CV, Portofolio, dan persiapan interview untuk memudahkan proses lamaran kerja.",
  },
];

const workExperienceData = [
  {
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTOatG9IDeqK--6K-Sgz6fRmJs89a-vIt8b-g&s",
    flag: "https://flagcdn.com/w320/sg.png",
    name: "Edudrift (Singapura)",
    country: "Singapore",
  },
  {
    logo: "/1631391501791.jpg",
    flag: "https://flagcdn.com/w320/sg.png",
    name: "Alem Health (Singapura)",
    country: "Singapore",
  },
  {
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQjh288taWRXQIW1jdP5t4-ni_Q6VmXBW5KaQ&s",
    flag: "https://flagcdn.com/w320/us.png",
    name: "Quizlet (Amerika Serikat)",
    country: "USA",
  },
  {
    logo: "/stalinks_logo.jpg",
    flag: "https://flagcdn.com/w320/hk.png",
    name: "Stalinks (Hong Kong)",
    country: "Hong Kong",
  },
];

const collaborationData = [
  {
    logo: "https://images.samsung.com/is/image/samsung/assets/id/about-us/brand/logo/mo/256_144_1.png?$512_N_PNG$",
    flag: "https://flagcdn.com/w320/kr.png",
    name: "Samsung (Korea Selatan)",
    country: "South Korea",
  },
  {
    logo: "https://kontenesia.com/wp-content/uploads/2022/02/logo-glints.png",
    flag: "https://flagcdn.com/w320/sg.png",
    name: "Glints (Singapura)",
    country: "Singapore",
  },
  {
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTetxzfx2_kUG9bCtbAMSRrdexmOLNe-HZCQA&s",
    flag: "https://flagcdn.com/w320/us.png",
    name: "EF (Amerika Serikat)",
    country: "USA",
  },
  {
    logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ50JWhyL_6EPXYH3Cw16x0JAI7IlmposX74Q&s",
    flag: "https://flagcdn.com/w320/id.png",
    name: "MySkill (Indonesia)",
    country: "Indonesia",
  },
];

const remoteWorkPhotos = [
  "https://i.imgur.com/8bOE6Eq.jpeg",
  "https://i.imgur.com/gny2XNh.jpeg",
  "https://i.imgur.com/Vcn2lI6.jpeg",
];

const howItWorksData = [
  {
    title: "Daftar Kursus Ini",
    description: [
      "Lakukan proses pendaftaraan dengan mudah dan bergabung dengan kursus ini!",
    ],
  },
  {
    title: "Akses Semua Materi",
    description: [
      "Setelah mendaftar, kamu langsung bisa mengakses video, template dan panduan lengkap yang kami sediakan",
    ],
  },
  {
    title: "Belajar Sesuai Waktu Kamu",
    description: [
      "Kamu bisa belajar kapan saja dan dimana saja, sesuai dengan waktu luangmu.",
    ],
  },
  {
    title: "Hands-On Projects",
    description: [
      "Aku akan membagikan strategi efektif untuk mendapatkan magang remote di perusahaan luar negeri.",
      "Jadi, kamu bisa langsung praktek apa yang dipelajari dari kursus ini dan memulai karier remote di digital marketing!",
    ],
  },
  {
    title: "Sertifikasi",
    description: [
      "Aku akan membagikan informasi eksklusif tentang sertifikat digital marketing bertaraf internasional yang akan membantu kamu mendapatkan pekerjaan remote impianmu!",
    ],
  },
  {
    title: "Ongoing Support",
    description: [
      "Bergabunglah dengan komunitas eksklusif kami untuk meraih sukses di pekerjaan remote!",
      "Dapatkan wawasan berharga dari sesama anggota, bimbingan langsung dari mentor kami, Peni dan tim, serta informasi lowongan kerja remote setiap minggunya!",
    ],
  },
];

const courseContentData = [
  "Sertifikasi Digital Marketing Bertaraf Internasional",
  "Interview 101 for a Remote Job",
  "Get Your First Remote Internship in Digital Marketing",
  "Applying for Remote Jobs",
  "Personal Branding on LinkedIn",
  "Mindset for Success in Remote Career",
];

const templatesData = [
  "CV Template (Bahasa Indonesia & English)",
  "Portfolio Template (Versi PDF & Situs Web)",
  "Template Email Follow-Up ke Recruiter",
  "Template Message to Send After Interview",
  "Template FAQ in Interview",
  "Template LinkedIn Banner",
];

const bonusData = [
  "Komunitas Eksklusif - Bergabunglah dengan komunitas kami untuk mendapatkan info peluang kerja remote terbaru setiap minggu.",
  "Mentor dan Support - Dapatkan dukungan langsung dari mentor kami, Peni & Tim, serta alumni yang siap membantu kamu mengembangkan karir remotemu.",
];

const testimonialImages = [
  "/2.png",
  "/3.png",
  "/4.png",
  "/6.png",
  "/8.png",
  "/9.png",
  "/10.png",
  "/11.png",
  "/12.png",
  "/13.png",
  "/15.png",
  "/16.png",
];

const faqData = [
  {
    question: "Apa itu Kerja Remote?",
    answer:
      "Kerja remote adalah sistem kerja di mana kamu bisa melakukan pekerjaan dari lokasi mana pun, tanpa harus datang ke kantor fisik. Pekerjaan dilakukan melalui internet, menggunakan alat komunikasi dan kolaborasi online. Dengan kerja remote, kamu bisa bekerja dari rumah, kafe, co-working space, atau bahkan sambil traveling, selama ada koneksi internet yang stabil.",
  },
  {
    question: "Apa itu digital marketing?",
    answer:
      "Digital marketing adalah strategi pemasaran yang memanfaatkan media digital dan internet untuk mempromosikan produk atau jasa. Sebuah karir di bidang ini melibatkan berbagai peran seperti mengelola kampanye iklan online, menganalisis data, optimasi SEO, manajemen media sosial, dan pembuatan konten kreatif. Dengan permintaan yang terus meningkat, karir di digital marketing menawarkan fleksibilitas, termasuk opsi bekerja remote dan freelance, serta peluang kerja di berbagai industri.",
  },
  {
    question:
      "Paket apa yang disarankan untuk diambil, starter atau full complete package?",
    answer:
      "Untuk kamu yang masih belum yakin dan ingin mencoba-coba terlebih dahulu, Starter Package adalah pilihan yang cocok. Paket ini memungkinkan kamu untuk mendapatkan gambaran dasar tentang digital marketing tanpa komitmen besar. Namun, jika kamu serius ingin mendapatkan pekerjaan remote dan siap berinvestasi lebih untuk masa depan karirmu, maka Full Complete Package adalah pilihan yang tepat.",
  },
  {
    question: "Apakah ada persyaratan tertentu untuk mengikuti kursus ini?",
    answer:
      "Tidak ada persyaratan khusus untuk mengikuti kursus ini. Bahkan jika kamu tidak memiliki pengalaman atau gelar diploma/sarjana, kamu tetap bisa bekerja remote di bidang digital marketing setelah menyelesaikan kursus ini. Kami menyediakan materi yang mudah dipahami dan praktis untuk membantu kamu memulai karir di bidang ini.",
  },
  {
    question: "Kursus online nya akan disampaikan dalam bahasa apa?",
    answer:
      "Kursus ini akan disampaikan dalam bahasa Indonesia dan bahasa Inggris, sehingga kamu dapat belajar dengan lebih nyaman dan mudah. Jangan khawatir, bahasa Inggris yang digunakan sangat mudah diikuti, jadi kamu tidak perlu takut untuk ikut kursus ini.",
  },
  {
    question: "Apakah dana yang sudah di transfer dapat di refund?",
    answer:
      "Kami tidak menyediakan refund untuk kursus ini. Namun, jika ada masalah dengan materi atau pengiriman kursus, kami dengan senang hati akan membantu untuk menyelesaikannya sebaik mungkin. Pastikan kamu memilih paket kursus dan membaca informasi dengan detail dan benar sebelum melakukan pembayaran.",
  },
  {
    question:
      "Berapa penghasilan yang bisa aku dapatkan dengan kerja remote di bidang digital marketing?",
    answer:
      "Penghasilan kerja remote di bidang digital marketing dapat sangat bervariasi. Sebagai pemula, kamu bisa mendapatkan sekitar Rp 5 juta hingga Rp 10 juta per bulan. Namun, jika kamu sudah berpengalaman atau bekerja dengan klien internasional, penghasilanmu bisa lebih dari itu, kamu dapat mencapai puluhan juta rupiah per bulan.",
  },
];
