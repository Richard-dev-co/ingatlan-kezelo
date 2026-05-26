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
let osszesFoglalas = []

function urlapMegjelenites(foglalas = null) {
    szerkesztesId = foglalas ? foglalas.id : null
    document.getElementById('urlap-cim').textContent = foglalas ? 'Foglalás szerkesztése' : 'Új foglalás hozzáadása'
    document.getElementById('cim').value = foglalas?.cim ?? ''
    document.getElementById('kezdet').value = foglalas ? foglalas.kezdet.slice(0, 16) : ''
    document.getElementById('vege').value = foglalas ? foglalas.vege.slice(0, 16) : ''
    document.getElementById('letszam').value = foglalas?.letszam ?? ''
    document.getElementById('statusz').value = foglalas?.statusz ?? 'függőben'
    document.getElementById('megjegyzes').value = foglalas?.megjegyzes ?? ''
    document.getElementById('urlap').classList.remove('rejtett')
    helyisegekBetolteseLegordulo(foglalas?.helyiseg_id)
    berlokBetolteseLegordulo(foglalas?.berlo_id)
}

function urlapElrejtes() {
    szerkesztesId = null
    document.getElementById('urlap').classList.add('rejtett')
}

async function helyisegekBetolteseLegordulo(kivalasztottId = null) {
    const select = document.getElementById('helyiseg_id')
    select.innerHTML = '<option value="">Válassz helyiséget *</option>'
    const { data } = await client.from('helyisegek').select('id, nev')
    data.forEach(h => {
        const option = document.createElement('option')
        option.value = h.id
        option.textContent = h.nev
        if (kivalasztottId && h.id === kivalasztottId) option.selected = true
        select.appendChild(option)
    })
}

async function berlokBetolteseLegordulo(kivalasztottId = null) {
    const select = document.getElementById('berlo_id')
    select.innerHTML = '<option value="">Válassz bérlőt (elhagyható)</option>'
    const { data } = await client.from('berlok').select('id, nev')
    data.forEach(b => {
        const option = document.createElement('option')
        option.value = b.id
        option.textContent = b.nev
        if (kivalasztottId && b.id === kivalasztottId) option.selected = true
        select.appendChild(option)
    })
}

async function mentese() {
    const cim = document.getElementById('cim').value
    const helyiseg_id = document.getElementById('helyiseg_id').value ? parseInt(document.getElementById('helyiseg_id').value) : null
    const berlo_id = document.getElementById('berlo_id').value ? parseInt(document.getElementById('berlo_id').value) : null
    const kezdet = document.getElementById('kezdet').value
    const vege = document.getElementById('vege').value
    const letszam = document.getElementById('letszam').value ? parseInt(document.getElementById('letszam').value) : null
    const statusz = document.getElementById('statusz').value
    const megjegyzes = document.getElementById('megjegyzes').value

    if (!cim || !helyiseg_id || !kezdet || !vege) {
        alert('A rendezvény neve, helyiség és időpontok kötelezők!')
        return
    }

    let error

    if (szerkesztesId) {
        const result = await client
            .from('foglalasok')
            .update({ cim, helyiseg_id, berlo_id: berlo_id || null, kezdet, vege, letszam, statusz, megjegyzes })
            .eq('id', szerkesztesId)
        error = result.error
    } else {
        const result = await client
            .from('foglalasok')
            .insert([{ cim, helyiseg_id, berlo_id: berlo_id || null, kezdet, vege, letszam, statusz, megjegyzes }])
        error = result.error
    }

    if (error) {
        alert('Hiba történt a mentés során!')
        console.error(error)
        return
    }

    urlapElrejtes()
    foglalasokBetoltese()
}

async function torles(id) {
    if (!confirm('Biztosan törölni szeretnéd ezt a foglalást?')) return
    const { error } = await client.from('foglalasok').delete().eq('id', id)
    if (error) {
        alert('Hiba történt a törlés során!')
        console.error(error)
        return
    }
    foglalasokBetoltese()
}

async function pdfGeneralas(id) {
    const foglalas = osszesFoglalas.find(f => f.id === id)
    if (!foglalas) return

    const { jsPDF } = window.jspdf
    const doc = new jsPDF()

    // Magyar font betöltése
    const fontUrl = './Roboto-Regular.ttf'
    const fontResponse = await fetch(fontUrl)
    const fontBuffer = await fontResponse.arrayBuffer()
    const fontBase64 = btoa(
        new Uint8Array(fontBuffer).reduce((data, byte) => data + String.fromCharCode(byte), '')
    )
    doc.addFileToVFS('Roboto.ttf', fontBase64)
    doc.addFont('Roboto.ttf', 'Roboto', 'normal')
    doc.setFont('Roboto')

    // Fejléc
    doc.setFontSize(20)
    doc.text('FOGLALÁS VISSZAIGAZOLÁS', 105, 20, { align: 'center' })

    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Foglalás azonosító: #${foglalas.id}`, 105, 28, { align: 'center' })

    doc.setDrawColor(200)
    doc.line(20, 33, 190, 33)

    // Rendezvény adatai
    doc.setFontSize(12)
    doc.setTextColor(0)
    doc.text('Rendezvény adatai', 20, 45)

    doc.setFontSize(11)
    doc.text(`Rendezvény neve: ${foglalas.cim}`, 20, 55)
    doc.text(`Helyiség: ${foglalas.helyisegek.nev}`, 20, 63)
    doc.text(`Kezdet: ${new Date(foglalas.kezdet).toLocaleString('hu-HU')}`, 20, 71)
    doc.text(`Vége: ${new Date(foglalas.vege).toLocaleString('hu-HU')}`, 20, 79)
    doc.text(`Várható létszám: ${foglalas.letszam ?? 'Nincs megadva'} fő`, 20, 87)

    doc.line(20, 93, 190, 93)

    // Bérlő adatai
    doc.setFontSize(12)
    doc.text('Kapcsolattartó', 20, 103)

    doc.setFontSize(11)
    doc.text(`Név: ${foglalas.berlok ? foglalas.berlok.nev : 'Ismeretlen vendég'}`, 20, 113)

    doc.line(20, 120, 190, 120)

    // Státusz
    doc.setFontSize(12)
    doc.text('Státusz és megjegyzés', 20, 130)

    doc.setFontSize(11)
    doc.text(`Státusz: ${foglalas.statusz}`, 20, 140)
    doc.text(`Megjegyzés: ${foglalas.megjegyzes ?? 'Nincs'}`, 20, 148)

    doc.line(20, 200, 190, 200)

    // Aláírás
    doc.setFontSize(11)
    doc.text('Bérbeadó aláírása:', 20, 220)
    doc.text('Bérlő aláírása:', 120, 220)
    doc.line(20, 235, 80, 235)
    doc.line(120, 235, 180, 235)

    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text(`Generálva: ${new Date().toLocaleDateString('hu-HU')}`, 105, 285, { align: 'center' })

    doc.save(`foglalas_${foglalas.cim}_${foglalas.id}.pdf`)
}

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

    osszesFoglalas = data

    lista.innerHTML = data.map(f => `
        <div class="helyiseg-kartya">
            <div>
                <h3>${f.cim}</h3>
                <p>🏢 ${f.helyisegek.nev}</p>
                <p>👤 ${f.berlok ? f.berlok.nev : 'Ismeretlen vendég'}</p>
                <p>📅 ${new Date(f.kezdet).toLocaleString('hu-HU')} – ${new Date(f.vege).toLocaleString('hu-HU')}</p>
                <p>👥 ${f.letszam ?? 'Nincs megadva'} fő</p>
                <p>${f.megjegyzes ?? ''}</p>
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
                <span class="statusz ${f.statusz}">${f.statusz}</span>
                <div style="display:flex;gap:8px">
                    <button onclick="pdfGeneralas(${f.id})" class="szerkeszt-gomb">📄 PDF</button>
                    <button onclick='urlapMegjelenites(${JSON.stringify(f)})' class="szerkeszt-gomb">Szerkesztés</button>
                    <button onclick="torles(${f.id})" class="torles-gomb">Törlés</button>
                </div>
            </div>
        </div>
    `).join('')
}

bejelentkezesEllenorzese()
foglalasokBetoltese()