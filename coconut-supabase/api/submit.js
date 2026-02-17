import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method not allowed' });
    }

    // Inisialisasi Supabase di sisi Server
    // Menggunakan Service Role Key (Admin) agar bisa bypass keamanan jika diperlukan
    const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { nama, alamat, jarak, jumlah, metode, buktiUrl } = req.body;

    // --- LOGIKA HITUNG HARGA (Diulang di sini agar aman dari manipulasi user) ---
    const HARGA_PER_BUTIR = 15000;
    const JARAK_DASAR = 4;
    const BIAYA_LEBIH = 1000;

    let totalHarga = parseInt(jumlah) * HARGA_PER_BUTIR;
    const jarakFloat = parseFloat(jarak);

    if (jarakFloat > JARAK_DASAR) {
        const kelebihan = Math.ceil(jarakFloat - JARAK_DASAR);
        totalHarga += kelebihan * BIAYA_LEBIH;
    }

    try {
        // Simpan ke Tabel 'orders'
        const { data, error } = await supabase
            .from('orders')
            .insert([
                {
                    nama: nama,
                    alamat: alamat,
                    jarak_km: jarakFloat,
                    jumlah_butir: parseInt(jumlah),
                    metode_bayar: metode,
                    total_bayar: totalHarga,
                    bukti_url: buktiUrl,
                    created_at: new Date()
                }
            ]);

        if (error) throw error;

        return res.status(200).json({ 
            message: 'Sukses', 
            total_formatted: "Rp " + totalHarga.toLocaleString('id-ID')
        });

    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}