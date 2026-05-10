import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Kebijakan Privasi TokoKu POS
          </h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-4">
              <strong>Tanggal efektif:</strong> 11 Mei 2026
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              1. Informasi yang Kami Kumpulkan
            </h2>
            <p className="text-gray-600 mb-4">
              Kami mengumpulkan informasi yang Anda berikan saat menggunakan aplikasi TokoKu POS, termasuk:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Data akun Google (email, nama) untuk autentikasi</li>
              <li>Data produk, kategori, dan transaksi yang Anda input</li>
              <li>Data toko dan profil bisnis Anda</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              2. Cara Kami Menggunakan Informasi
            </h2>
            <p className="text-gray-600 mb-4">
              Informasi yang kami kumpulkan digunakan untuk:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Mengelola akun dan autentikasi pengguna</li>
              <li>Menyimpan dan mengelola data produk serta transaksi</li>
              <li>Menyinkronkan data ke Google Sheets untuk backup</li>
              <li>Meningkatkan kinerja dan pengalaman pengguna</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              3. Berbagi Informasi
            </h2>
            <p className="text-gray-600 mb-4">
              Kami tidak menjual informasi pribadi Anda. Informasi hanya dibagikan dalam kondisi berikut:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Dengan Google saat autentikasi menggunakan akun Google</li>
              <li>Ketika Anda menghubungkan aplikasi ke Google Sheets untuk backup data</li>
              <li>Jika diwajibkan oleh hukum</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              4. Keamanan Data
            </h2>
            <p className="text-gray-600 mb-4">
              Kami menggunakan enkripsi dan prosedur keamanan yang standar industri untuk melindungi data Anda. Data disimpan di database lokal dan dapat di-backup ke Google Sheets atas permintaan Anda.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              5. Hak Anda
            </h2>
            <p className="text-gray-600 mb-4">
              Anda berhak mengakses, memperbaiki, atau menghapus data pribadi Anda. Anda juga dapat menarik izin akses Google kapan saja melalui pengaturan akun Google.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              6. Kontak
            </h2>
            <p className="text-gray-600 mb-4">
              Jika ada pertanyaan tentang kebijakan privasi ini, hubungi:
            </p>
            <p className="text-gray-600 font-medium">
              Email: faruq.blogger@gmail.com
            </p>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <Link 
                href="/"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                ← Kembali ke Beranda
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
