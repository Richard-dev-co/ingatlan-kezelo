const supabaseUrl = 'https://hbhugixkxwzelzonwmnr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiaHVnaXhreHd6ZWx6b253bW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwODQ1NzMsImV4cCI6MjA5NDY2MDU3M30.DpLzLUPITaABJdxeZx1GP9M2cTzf4tIdCsDZQV-RYSg'

const { createClient } = supabase
const client = createClient(supabaseUrl, supabaseKey)

// Bejelentkezés ellenőrzése
async function bejelentkezesEllenorzese() {
    const { data: { session } } = await client.auth.getSession()
    if (!session) {
        window.location.href = 'login.html'
    }
}

// Kijelentkezés
async function kijelentkezes() {
    await client.auth.signOut()
    window.location.href = 'login.html'
}

async function berlokBetoltese() {
    const lista = document.getElementById('berlok-lista')

    const { data, error } = await client
        .from('berlok')
        .select('*')

    if (error) {
        lista.innerHTML = '<p>Hiba történt az adatok betöltésekor.</p>'
        console.error(error)
        return
    }

    if (data.length === 0) {
        lista.innerHTML = '<p>Nincsenek bérlők.</p>'
        return
    }

    lista.innerHTML = data.map(b => `
        <div class="helyiseg-kartya">
            <div>
                <h3>${b.nev}</h3>
                <p>📧 ${b.email}</p>
                <p>📞 ${b.telefon ?? 'Nincs megadva'}</p>
                <p>📍 ${b.cim ?? 'Nincs megadva'}</p>
            </div>
            <div>
                <p>Adószám: ${b.adoszam ?? 'Nincs megadva'}</p>
                <p>${b.megjegyzes ?? ''}</p>
            </div>
        </div>
    `).join('')
}

bejelentkezesEllenorzese()
berlokBetoltese()