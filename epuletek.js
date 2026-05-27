const supabaseUrl = 'https://hbhugixkxwzelzonwmnr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiaHVnaXhreHd6ZWx6b253bW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwODQ1NzMsImV4cCI6MjA5NDY2MDU3M30.DpLzLUPITaABJdxeZx1GP9M2cTzf4tIdCsDZQV-RYSg'
const client = window.supabase.createClient(supabaseUrl, supabaseKey)

async function bejelentkezesEllenorzese() {
    const { data: { session } } = await client.auth.getSession()
    if (!session) window.location.href = 'login.html'
}

async function kijelentkezes() {
    await client.auth.signOut()
    window.location.href = 'login.html'
}

let szerkesztesId = null
let emeletSzerkesztesId = null

// Épület űrlap
function urlapMegjelenites(epulet = null) {
    szerkesztesId = epulet ? epulet.id : null
    document.getElementById('urlap-cim').textContent = epulet ? 'Épület szerkesztése' : 'Új épület hozzáadása'
    document.getElementById('nev').value = epulet?.nev ?? ''
    document.getElementById('cim').value = epulet?.cim ?? ''
    document.getElementById('leiras').value = epulet?.leiras ?? ''
    document.getElementById('urlap').classList.remove('rejtett')
    document.getElementById('emelet-urlap').classList.add('rejtett')
}

function urlapElrejtes() {
    szerkesztesId = null
    document.getElementById('urlap').classList.add('rejtett')
}

async function mentese() {
    const nev = document.getElementById('nev').value
    const cim = document.getElementById('cim').value
    const leiras = document.getElementById('leiras').value

    if (!nev) {
        alert('Az épület neve kötelező!')
        return
    }

    let error

    if (szerkesztesId) {
        const result = await client
            .from('epuletek')
            .update({ nev, cim, leiras })
            .eq('id', szerkesztesId)
        error = result.error
    } else {
        const result = await client
            .from('epuletek')
            .insert([{ nev, cim, leiras }])
        error = result.error
    }

    if (error) {
        alert('Hiba történt a mentés során!')
        console.error(error)
        return
    }

    urlapElrejtes()
    epuletekBetoltese()
}

async function epuletTorles(id) {
    if (!confirm('Biztosan törölni szeretnéd ezt az épületet? Az összes emelet is törlődik!')) return
    const { error } = await client.from('epuletek').delete().eq('id', id)
    if (error) {
        alert('Hiba történt a törlés során!')
        console.error(error)
        return
    }
    epuletekBetoltese()
}

// Emelet űrlap
async function emeletUrlapMegjelenites(epuletId, emelet = null) {
    emeletSzerkesztesId = emelet ? emelet.id : null
    document.getElementById('emelet-urlap-cim').textContent = emelet ? 'Emelet szerkesztése' : 'Új emelet hozzáadása'
    document.getElementById('emelet-nev').value = emelet?.nev ?? ''
    document.getElementById('emelet-leiras').value = emelet?.leiras ?? ''
    document.getElementById('emelet-urlap').classList.remove('rejtett')
    document.getElementById('urlap').classList.add('rejtett')

    // Épület legördülő
    const select = document.getElementById('emelet-epulet-id')
    select.innerHTML = '<option value="">Válassz épületet *</option>'
    const { data } = await client.from('epuletek').select('id, nev')
    data.forEach(e => {
        const option = document.createElement('option')
        option.value = e.id
        option.textContent = e.nev
        if (e.id === epuletId) option.selected = true
        select.appendChild(option)
    })
}

function emeletUrlapElrejtes() {
    emeletSzerkesztesId = null
    document.getElementById('emelet-urlap').classList.add('rejtett')
}

async function emeletMentese() {
    const epulet_id = parseInt(document.getElementById('emelet-epulet-id').value)
    const nev = document.getElementById('emelet-nev').value
    const leiras = document.getElementById('emelet-leiras').value

    if (!epulet_id || !nev) {
        alert('Az épület és emelet neve kötelező!')
        return
    }

    let error

    if (emeletSzerkesztesId) {
        const result = await client
            .from('emeletek')
            .update({ epulet_id, nev, leiras })
            .eq('id', emeletSzerkesztesId)
        error = result.error
    } else {
        const result = await client
            .from('emeletek')
            .insert([{ epulet_id, nev, leiras }])
        error = result.error
    }

    if (error) {
        alert('Hiba történt a mentés során!')
        console.error(error)
        return
    }

    emeletUrlapElrejtes()
    epuletekBetoltese()
}

async function emeletTorles(id) {
    if (!confirm('Biztosan törölni szeretnéd ezt az emeletet?')) return
    const { error } = await client.from('emeletek').delete().eq('id', id)
    if (error) {
        alert('Hiba történt a törlés során!')
        console.error(error)
        return
    }
    epuletekBetoltese()
}

async function epuletekBetoltese() {
    const lista = document.getElementById('epuletek-lista')

    const { data: epuletek, error } = await client
        .from('epuletek')
        .select(`*, emeletek (*)`)
        .order('nev')

    if (error) {
        lista.innerHTML = '<p>Hiba történt az adatok betöltésekor.</p>'
        console.error(error)
        return
    }

    if (epuletek.length === 0) {
        lista.innerHTML = '<p>Nincsenek épületek.</p>'
        return
    }

    lista.innerHTML = epuletek.map(e => `
        <div class="epulet-kartya">
            <div class="epulet-fejlec">
                <div>
                    <h3>🏛️ ${e.nev}</h3>
                    ${e.cim ? `<p>📍 ${e.cim}</p>` : ''}
                    ${e.leiras ? `<p>${e.leiras}</p>` : ''}
                </div>
                <div style="display:flex;gap:8px">
                    <button onclick="emeletUrlapMegjelenites(${e.id})" class="szerkeszt-gomb">+ Emelet</button>
                    <button onclick='urlapMegjelenites(${JSON.stringify(e)})' class="szerkeszt-gomb">Szerkesztés</button>
                    <button onclick="epuletTorles(${e.id})" class="torles-gomb">Törlés</button>
                </div>
            </div>
            <div class="emeletek-lista">
                ${e.emeletek && e.emeletek.length > 0
                    ? e.emeletek.map(em => `
                        <div class="emelet-sor">
                            <span>🏢 ${em.nev} ${em.leiras ? '– ' + em.leiras : ''}</span>
                            <div style="display:flex;gap:8px">
                                <button onclick='emeletUrlapMegjelenites(${e.id}, ${JSON.stringify(em)})' class="szerkeszt-gomb">Szerkesztés</button>
                                <button onclick="emeletTorles(${em.id})" class="torles-gomb">Törlés</button>
                            </div>
                        </div>
                    `).join('')
                    : '<p style="color:var(--text-secondary);font-size:14px;padding:8px 0">Még nincs emelet felvéve.</p>'
                }
            </div>
        </div>
    `).join('')
}

bejelentkezesEllenorzese()
epuletekBetoltese()