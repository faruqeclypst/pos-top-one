import Link from 'next/link';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Syarat & Ketentuan TokoKu POS
          </h1>
          
          <div className="prose prose-gray max-w-none">
            <p className="text-gray-600 mb-4">
              <strong>Tanggal efektif:</strong> 11 Mei 2026
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              1. Persetujuan Penggunaan
            </h2>
            <p className="text-gray-600 mb-4">
              Dengan mengakses atau menggunakan aplikasi TokoKu POS ("Aplikasi"), Anda menyetujui untuk terikat dengan syarat dan ketentuan berikut. Jika Anda tidak menyetujui syarat ini, mohon tidak menggunakan Aplikasi.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              2. Deskripsi Layanan
            </h2>
            <p className="text-gray-600 mb-4">
              TokoKu POS adalah aplikasi point of sale (POS) berbasis web dan mobile yang memungkinkan pengguna mengelola produk, transaksi, dan laporan penjualan. Aplikasi ini menyediakan fitur:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Manajemen produk dan kategori</li>
              <li>Pencatatan transaksi penjualan</li>
              <li>Manajemen supplier</li>
              <li>Backup data ke Google Sheets</li>
              <li>Laporan penjualan</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              3. Akun dan Keamanan
            </h2>
            <p className="text-gray-600 mb-4">
              Untuk menggunakan fitur tertentu, Anda perlu membuat akun menggunakan akun Google. Anda bertanggung jawab menjaga kerahasiaan kredensial akun Anda dan semua aktivitas yang terjadi di bawah akun tersebut.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              4. Hak Kekayaan Intelektual
            </h2>
            <p className="text-gray-600 mb-4">
              Seluruh konten, desain, kode, dan fitur Aplikasi TokoKu POS adalah milik pengembang atau pemberi lisensi. Anda tidak boleh menyalin, memodifikasi, mendistribusikan, atau membuat karya turunan dari Aplikasi tanpa izin tertulis.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              5. Batasan Penggunaan
            </h2>
            <p className="text-gray-600 mb-4">
              Anda setuju tidak menggunakan Aplikasi untuk:
            </p>
            <ul className="list-disc pl-6 text-gray-600 mb-4">
              <li>Melakukan aktivitas ilegal atau melanggar hukum</li>
              <li>Mengganggu atau menghambat layanan Aplikasi</li>
              <li>Mengakses data pengguna lain tanpa izin</li>
              <li>Menggunakan bot atau script otomatis</li>
              <li>Mendekompilasi atau reverse engineering</li>
            </ul>

            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              6. Data dan Privasi
            </h2>
            <p className="text-gray-600 mb-4">
              Data yang Anda input ke dalam Aplikasi (produk, transaksi, dll) tetap menjadi milik Anda. Dengan menggunakan Aplikasi, Anda memberikan izin terbatas kepada kami untuk mengakses dan memproses data tersebut guna menyediakan layanan. Data dapat disinkronkan ke Google Sheets atas permintaan Anda. Silakan baca <Link href="/privacy-policy" className="text-blue-600 hover:underline">Kebijakan Privasi</Link> untuk detail lebih lanjut.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              7. Perubahan Layanan
            </h2>
            <p className="text-gray-600 mb-4">
              Kami berhak memodifikasi atau menghentikan layanan kapan saja tanpa pemberitahuan sebelumnya. Kami tidak bertanggung jawab atas kerugian yang timbul dari perubahan, penghentian, atau akses yang terbatas ke layanan.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              8. Penolakan Jaminan
            </h2>
            <p className="text-gray-600 mb-4">
              Aplikasi disediakan "sebagaimana adanya" tanpa jaminan apapun, baik yang eksplisit maupun implisit. Kami tidak menjamin bahwa Aplikasi akan bebas dari kesalahan, gangguan, atau kerusakan.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              9. Batasan Tanggung Jawab
            </h2>
            <p className="text-gray-600 mb-4">
              Dalam batas yang diizinkan oleh hukum, pengembang tidak bertanggung jawab atas kerugian langsung, tidak langsung, insidental, atau konsekuensial yang timbul dari penggunaan atau ketidakmampuan menggunakan Aplikasi.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              10. Hukum yang Berlaku
            </h2>
            <p className="text-gray-600 mb-4">
              Syarat dan ketentuan ini diatur oleh hukum Republik Indonesia. Setiap sengketa yang timbul akan diselesaikan di pengadilan yang berwenang di Jakarta, Indonesia.
            </p>

            <h2 className="text-xl font-semibold text-gray-900 mt-6 mb-3">
              11. Kontak
            </h2>
            <p className="text-gray-600 mb-4">
              Jika ada pertanyaan tentang syarat dan ketentuan ini, hubungi:
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
