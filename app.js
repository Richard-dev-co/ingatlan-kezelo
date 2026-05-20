const supabaseUrl = 'https://hbhugixkxwzelzonwmnr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiaHVnaXhreHd6ZWx6b253bW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwODQ1NzMsImV4cCI6MjA5NDY2MDU3M30.DpLzLUPITaABJdxeZx1GP9M2cTzf4tIdCsDZQV-RYSg'

const { createClient } = supabase
const client = createClient(supabaseUrl, supabaseKey)

async function helyisegekBetoltese() {
    const lista = document.getElementById('helyisegek-lista')
    
    const { data, error } = await client
        .from('helyisegek')
        .select('*')

    if (error) {
        lista.innerHTML = '<p>Hiba történt az adatok betöltésekor.</p>'
        console.error(error)
        return
    }

    if (data.length === 0) {
        lista.innerHTML = '<p>Nincsenek helyiségek.</p>'
        return
    }

    lista.innerHTML = data.map(h => `
        <div class="helyiseg-kartya">
            <div>
                <h3>${h.nev}</h3>
                <p>${h.tipus} | ${h.terulet_m2} m² | ${h.ferohely} fő | ${h.ar_havi} Ft/hó</p>
                <p>${h.leiras ?? ''}</p>
            </div>
            <span class="statusz ${h.statusz}">${h.statusz}</span>
        </div>
    `).join('')
}

helyisegekBetoltese()