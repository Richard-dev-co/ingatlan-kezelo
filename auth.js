const supabaseUrl = 'https://hbhugixkxwzelzonwmnr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiaHVnaXhreHd6ZWx6b253bW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwODQ1NzMsImV4cCI6MjA5NDY2MDU3M30.DpLzLUPITaABJdxeZx1GP9M2cTzf4tIdCsDZQV-RYSg'

const { createClient } = supabase
const client = createClient(supabaseUrl, supabaseKey)

async function bejelentkezes() {
    const email = document.getElementById('email').value
    const jelszo = document.getElementById('jelszo').value
    const hibaUzenet = document.getElementById('hiba-uzenet')

    if (!email || !jelszo) {
        hibaUzenet.textContent = 'Kérlek töltsd ki mindkét mezőt!'
        hibaUzenet.classList.remove('rejtett')
        return
    }

    const { error } = await client.auth.signInWithPassword({
        email: email,
        password: jelszo
    })

    if (error) {
        hibaUzenet.textContent = 'Hibás email vagy jelszó!'
        hibaUzenet.classList.remove('rejtett')
        return
    }

    // Sikeres bejelentkezés – átirányítás a főoldalra
    window.location.href = 'index.html'
}