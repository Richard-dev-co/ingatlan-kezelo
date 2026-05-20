const supabaseUrl = 'https://hbhugixkxwzelzonwmnr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiaHVnaXhreHd6ZWx6b253bW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwODQ1NzMsImV4cCI6MjA5NDY2MDU3M30.DpLzLUPITaABJdxeZx1GP9M2cTzf4tIdCsDZQV-RYSg'

const { createClient } = supabase
const client = createClient(supabaseUrl, supabaseKey)

async function foglalasokBetoltese() {
    const lista = document.getElementById('foglalasok-lista')

    const { data, error } = await client
        .from('foglalasok')
        .select(`*, helyisegek (nev), berlok (nev)`)
        .order('kezdet', { ascending: true })

    if (error) {
        lista.innerHTML = '<p>Hiba történt az adatok betöltésekor.</p>'
        console.error(error)
        return
    }

    if (data.length === 0) {
        lista.innerHTML = '<p>Nincsenek foglalások.</p>'
        return
    }

    lista.innerHTML = data.map(f => `
        <div class="helyiseg-kartya">
            <div>
                <h3>${f.cim}</h3>
                <p>🏢 ${f.helyisegek.nev}</p>
                <p>👤 ${f.berlok ? f.berlok.nev : 'Ismeretlen vendég'}</p>
                <p>📅 ${new Date(f.kezdet).toLocaleString('hu-HU')} – ${new Date(f.vege).toLocaleString('hu-HU')}</p>
                <p>👥 ${f.letszam ?? 'Nincs megadva'} fő</p>
            </div>
            <span class="statusz ${f.statusz}">${f.statusz}</span>
        </div>
    `).join('')
}

foglalasokBetoltese()