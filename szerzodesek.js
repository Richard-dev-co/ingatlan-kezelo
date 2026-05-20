const supabaseUrl = 'https://hbhugixkxwzelzonwmnr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiaHVnaXhreHd6ZWx6b253bW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwODQ1NzMsImV4cCI6MjA5NDY2MDU3M30.DpLzLUPITaABJdxeZx1GP9M2cTzf4tIdCsDZQV-RYSg'

const { createClient } = supabase
const client = createClient(supabaseUrl, supabaseKey)

async function szerzodesekBetoltese() {
    const lista = document.getElementById('szerzodesek-lista')

    const { data, error } = await client
        .from('szerzodesek')
        .select(`*, berlok (nev), helyisegek (nev)`)

    if (error) {
        lista.innerHTML = '<p>Hiba történt az adatok betöltésekor.</p>'
        console.error(error)
        return
    }

    if (data.length === 0) {
        lista.innerHTML = '<p>Nincsenek szerződések.</p>'
        return
    }

    lista.innerHTML = data.map(sz => `
        <div class="helyiseg-kartya">
            <div>
                <h3>${sz.berlok.nev}</h3>
                <p>🏢 ${sz.helyisegek.nev}</p>
                <p>📅 ${sz.kezdet} – ${sz.vege ?? 'Határozatlan'}</p>
            </div>
            <div>
                <p>💰 ${sz.havi_dij ?? 'Nincs megadva'} Ft/hó</p>
                <span class="statusz ${sz.statusz}">${sz.statusz}</span>
            </div>
        </div>
    `).join('')
}

szerzodesekBetoltese()