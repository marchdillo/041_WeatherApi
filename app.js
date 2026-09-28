const express = require("express");
const axios = require("axios");
const path = require("path");

const app = express();
const PORT = 3000;
const apikey = "vWXPrudoV4tnwNqYPVkL";

app.use(express.static(path.join(__dirname, "public")));

// Ambil nama wilayah dari fitur itu sendiri + context-nya, berdasarkan tipe (country, region, dst.)
function ambil(feature, tipe) {
  const semua = [feature, ...(feature.context || [])];
  for (const t of tipe) {
    const ketemu = semua.find((c) => (c.id || "").split(".")[0] === t);
    if (ketemu) return ketemu.text;
  }
  return "-";
}

app.get("/api/lokasi", async (req, res) => {
  const kota = (req.query.kota || "").trim();
  if (!kota) return res.status(400).json({ message: "Lokasi belum diisi." });

  const url = `https://api.maptiler.com/geocoding/${encodeURIComponent(kota)}.json`;

  try {
    const { data } = await axios.get(url, {
      params: { key: apikey, language: "id", limit: 1 },
    });

    const hasil = data.features[0];
    if (!hasil)
      return res.status(404).json({ message: "Lokasi tidak ditemukan." });

    const [longitude, latitude] = hasil.geometry.coordinates;

    res.json({
      nama_lengkap: hasil.place_name,
      negara: ambil(hasil, ["country"]),
      provinsi: ambil(hasil, ["region"]),
      kecamatan: ambil(hasil, [
        "municipal_district",
        "joint_submunicipality",
        "municipality",
        "locality",
      ]),
      longitude,
      latitude,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: "Gagal mengambil data dari MapTiler." });
  }
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
