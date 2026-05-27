function setemaValt() {
    const html = document.documentElement
    const gomb = document.getElementById('tema-gomb')
    
    if (html.getAttribute('data-theme') === 'dark') {
        html.removeAttribute('data-theme')
        localStorage.setItem('tema', 'vilagos')
        gomb.textContent = '🌙'
    } else {
        html.setAttribute('data-theme', 'dark')
        localStorage.setItem('tema', 'sotet')
        gomb.textContent = '☀️'
    }
}

// Oldal betöltésekor alkalmazza a mentett témát
function temaAlkalmazasa() {
    const mentettTema = localStorage.getItem('tema')
    const gomb = document.getElementById('tema-gomb')
    if (mentettTema === 'sotet') {
        document.documentElement.setAttribute('data-theme', 'dark')
        if (gomb) gomb.textContent = '☀️'
    }
}

temaAlkalmazasa()