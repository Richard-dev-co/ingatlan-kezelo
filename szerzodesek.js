const supabaseUrl = 'https://hbhugixkxwzelzonwmnr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhiaHVnaXhreHd6ZWx6b253bW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwODQ1NzMsImV4cCI6MjA5NDY2MDU3M30.DpLzLUPITaABJdxeZx1GP9M2cTzf4tIdCsDZQV-RYSg'
const client = window.supabase.createClient(supabaseUrl, supabaseKey)

function magyarDatum(datum) {
    if (!datum) return 'Határozatlan'
    return new Date(datum).toLocaleDateString('hu-HU', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    })
}

async function bejelentkezesEllenorzese() {
    const { data: { session } } = await client.auth.getSession()
    if (!session) window.location.href = 'login.html'
}

async function kijelentkezes() {
    await client.auth.signOut()
    window.location.href = 'login.html'
}

let szerkesztesId = null
let osszesSzerzodes = []

function urlapMegjelenites(szerzodes = null) {
    szerkesztesId = szerzodes ? szerzodes.id : null
    document.getElementById('urlap-cim').textContent = szerzodes ? 'Szerződés szerkesztése' : 'Új szerződés hozzáadása'
    document.getElementById('kezdet').value = szerzodes?.kezdet ?? ''
    document.getElementById('vege').value = szerzodes?.vege ?? ''
    document.getElementById('havi_dij').value = szerzodes?.havi_dij ?? ''
    document.getElementById('statusz').value = szerzodes?.statusz ?? 'aktív'
    document.getElementById('megjegyzes').value = szerzodes?.megjegyzes ?? ''
    document.getElementById('urlap').classList.remove('rejtett')
    berlokBetolteseLegordulo(szerzodes?.berlo_id)
    helyisegekBetolteseLegordulo(szerzodes?.helyiseg_id)
}

function urlapElrejtes() {
    szerkesztesId = null
    document.getElementById('urlap').classList.add('rejtett')
    document.getElementById('fajl').value = ''
}

async function berlokBetolteseLegordulo(kivalasztottId = null) {
    const select = document.getElementById('berlo_id')
    select.innerHTML = '<option value="">Válassz bérlőt *</option>'
    const { data } = await client.from('berlok').select('id, nev')
    data.forEach(b => {
        const option = document.createElement('option')
        option.value = b.id
        option.textContent = b.nev
        if (kivalasztottId && b.id === kivalasztottId) option.selected = true
        select.appendChild(option)
    })
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

async function mentese() {
    const berlo_id = parseInt(document.getElementById('berlo_id').value)
    const helyiseg_id = parseInt(document.getElementById('helyiseg_id').value)
    const kezdet = document.getElementById('kezdet').value
    const vege = document.getElementById('vege').value
    const havi_dij = document.getElementById('havi_dij').value
    const statusz = document.getElementById('statusz').value
    const megjegyzes = document.getElementById('megjegyzes').value

    if (!berlo_id || !helyiseg_id || !kezdet) {
        alert('A bérlő, helyiség és kezdet dátum kötelező!')
        return
    }

    let id = szerkesztesId
    let error

    if (szerkesztesId) {
        const result = await client
            .from('szerzodesek')
            .update({ kezdet, vege: vege || null, havi_dij, statusz, megjegyzes })
            .eq('id', szerkesztesId)
        error = result.error

        if (!error) {
            await client.rpc('update_szerzodes_kapcsolatok', {
                p_id: szerkesztesId,
                p_berlo_id: berlo_id,
                p_helyiseg_id: helyiseg_id
            })
        }
    } else {
        const result = await client
            .from('szerzodesek')
            .insert([{ berlo_id, helyiseg_id, kezdet, vege: vege || null, havi_dij, statusz, megjegyzes }])
            .select()
        error = result.error
        if (!error && result.data) id = result.data[0].id
    }

    if (error) {
        alert('Hiba történt a mentés során!')
        console.error(error)
        return
    }

    const fajl = document.getElementById('fajl').files[0]
    if (fajl && id) {
        const nev = `${id}/${Date.now()}_${fajl.name}`
        const { error: fajlHiba } = await client.storage
            .from('szerzodesek')
            .upload(nev, fajl)
        if (fajlHiba) {
            alert('Hiba történt a fájl feltöltésekor!')
            console.error(fajlHiba)
        }
    }

    urlapElrejtes()
    szerzodesekBetoltese()
}

async function torles(id) {
    if (!confirm('Biztosan törölni szeretnéd ezt a szerződést?')) return
    const { error } = await client.from('szerzodesek').delete().eq('id', id)
    if (error) {
        alert('Hiba történt a törlés során!')
        console.error(error)
        return
    }
    szerzodesekBetoltese()
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

async function fajlTorles(szerzodesId, utvonal) {
    if (!confirm('Biztosan törölni szeretnéd ezt a fájlt?')) return

    const { error } = await client.storage
        .from('szerzodesek')
        .remove([utvonal])

    if (error) {
        alert('Hiba történt a törlés során!')
        console.error(error)
        return
    }

    szerzodesekBetoltese()
}

function szures() {
    const kereses = document.getElementById('kereses').value.toLowerCase()
    const statusz = document.getElementById('statusz-szuro').value

    const szurt = osszesSzerzodes.filter(sz => {
        const berloNev = sz.berlok?.nev?.toLowerCase() ?? ''
        const helyisegNev = sz.helyisegek?.nev?.toLowerCase() ?? ''
        const egyezikKereses = berloNev.includes(kereses) || helyisegNev.includes(kereses)
        const egyezikStatusz = statusz === '' || sz.statusz === statusz
        return egyezikKereses && egyezikStatusz
    })

    kartyakMegjelenites(szurt)
}

async function kartyakMegjelenites(data) {
    const lista = document.getElementById('szerzodesek-lista')

    if (data.length === 0) {
        lista.innerHTML = '<p>Nincs találat.</p>'
        return
    }

    const kartyak = await Promise.all(data.map(async sz => {
        const { data: fajlok } = await client.storage
            .from('szerzodesek')
            .list(`${sz.id}`)

        const fajlLinkek = fajlok && fajlok.length > 0
            ? (await Promise.all(fajlok.map(async f => {
                const { data: url } = await client.storage
                    .from('szerzodesek')
                    .createSignedUrl(`${sz.id}/${f.name}`, 3600)
                const isKep = f.name.match(/\.(jpg|jpeg|png|gif|webp)$/i)
                if (isKep) {
                    return `
                        <div class="fajl-kontener">
                            <a href="${url.signedUrl}" target="_blank">
                                <img src="${url.signedUrl}" alt="${f.name}" class="helyiseg-kep">
                            </a>
                            <button onclick="fajlTorles(${sz.id}, '${sz.id}/${f.name}')" class="fajl-torles-gomb">🗑️</button>
                        </div>`
                }
                return `
                    <div class="fajl-kontener">
                        <a href="${url.signedUrl}" target="_blank" class="fajl-link">📎 ${f.name}</a>
                        <button onclick="fajlTorles(${sz.id}, '${sz.id}/${f.name}')" class="fajl-torles-gomb">🗑️</button>
                    </div>`
            }))).join('')
            : ''

        return `
            <div class="helyiseg-kartya">
                <div>
                    <h3>${sz.berlok.nev}</h3>
                    <p>🏢 ${sz.helyisegek.nev}</p>
                    <p>📅 ${magyarDatum(sz.kezdet)} – ${magyarDatum(sz.vege)}</p>
                    <p>💰 ${sz.havi_dij ?? 'Nincs megadva'} Ft/hó</p>
                    <p>${sz.megjegyzes ?? ''}</p>
                    <div class="fajl-lista">${fajlLinkek}</div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px">
                    <span class="statusz ${sz.statusz}">${sz.statusz}</span>
                    <div style="display:flex;gap:8px">
                        <button onclick="pdfGeneralas(${sz.id})" class="szerkeszt-gomb">📄 PDF</button>
                        <button onclick='urlapMegjelenites(${JSON.stringify(sz)})' class="szerkeszt-gomb">Szerkesztés</button>
                        <button onclick="torles(${sz.id})" class="torles-gomb">Törlés</button>
                    </div>
                </div>
            </div>
        `
    }))

    lista.innerHTML = kartyak.join('')
}

async function szerzodesekBetoltese() {
    const lista = document.getElementById('szerzodesek-lista')

    const { data, error } = await client
        .from('szerzodesek')
        .select(`*, berlok (*), helyisegek (*)`)

    if (error) {
        lista.innerHTML = '<p>Hiba történt az adatok betöltésekor.</p>'
        console.error(error)
        return
    }

    if (data.length === 0) {
        lista.innerHTML = '<p>Nincsenek szerződések.</p>'
        return
    }

    osszesSzerzodes = data
    kartyakMegjelenites(data)
}

async function pdfGeneralas(id) {
    const szerzodes = osszesSzerzodes.find(sz => sz.id === id)
    if (!szerzodes) return

    const { jsPDF } = window.jspdf
    const doc = new jsPDF()

   // Magyar font betöltése (TTF)
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
    doc.setFont('Roboto', 'normal')
    doc.text('BÉRLETI SZERZŐDÉS', 105, 20, { align: 'center' })

    doc.setFontSize(10)
    doc.setTextColor(100)
    doc.text(`Szerződés azonosító: #${szerzodes.id}`, 105, 28, { align: 'center' })

    doc.setDrawColor(200)
    doc.line(20, 33, 190, 33)

    // Bérlő adatai
    doc.setFontSize(12)
    doc.setTextColor(0)
    doc.text('Bérlő adatai', 20, 45)

    doc.setFontSize(11)
    doc.text(`Név: ${szerzodes.berlok.nev}`, 20, 55)
    doc.text(`Email: ${szerzodes.berlok.email}`, 20, 63)
    doc.text(`Telefon: ${szerzodes.berlok.telefon ?? 'Nincs megadva'}`, 20, 71)
    doc.text(`Cím: ${szerzodes.berlok.cim ?? 'Nincs megadva'}`, 20, 79)
    doc.text(`Adószám: ${szerzodes.berlok.adoszam ?? 'Nincs megadva'}`, 20, 87)

    doc.line(20, 93, 190, 93)

    // Helyiség
    doc.setFontSize(12)
    doc.text('Bérelt helyiség', 20, 103)

    doc.setFontSize(11)
    doc.text(`Helyiség neve: ${szerzodes.helyisegek.nev}`, 20, 113)
    doc.text(`Típus: ${szerzodes.helyisegek.tipus ?? 'Nincs megadva'}`, 20, 121)
    doc.text(`Terület: ${szerzodes.helyisegek.terulet_m2 ?? 'Nincs megadva'} m²`, 20, 129)

    doc.line(20, 135, 190, 135)

    // Feltételek
    doc.setFontSize(12)
    doc.text('Szerződés feltételei', 20, 145)

    doc.setFontSize(11)
    doc.text(`Kezdet: ${szerzodes.kezdet}`, 20, 155)
    doc.text(`Vége: ${szerzodes.vege ?? 'Határozatlan idejű'}`, 20, 163)
    doc.text(`Havi díj: ${szerzodes.havi_dij ?? 'Nincs megadva'} Ft`, 20, 171)
    doc.text(`Státusz: ${szerzodes.statusz}`, 20, 179)
    doc.text(`Megjegyzés: ${szerzodes.megjegyzes ?? 'Nincs'}`, 20, 187)

    doc.line(20, 220, 190, 220)

    // Aláírás
    doc.setFontSize(11)
    doc.text('Bérbeadó aláírása:', 20, 240)
    doc.text('Bérlő aláírása:', 120, 240)
    doc.line(20, 255, 80, 255)
    doc.line(120, 255, 180, 255)

    doc.setFontSize(9)
    doc.setTextColor(100)
    doc.text(`Generálva: ${new Date().toLocaleDateString('hu-HU')}`, 105, 285, { align: 'center' })

    doc.save(`szerzodes_${szerzodes.berlok.nev}_${szerzodes.kezdet}.pdf`)
}

bejelentkezesEllenorzese()
szerzodesekBetoltese()