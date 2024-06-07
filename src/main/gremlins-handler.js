function setBookmarkletScript() {
	const clicker = document.getElementById('clicker').checked,
		toucher = document.getElementById('toucher').checked,
		formFiller = document.getElementById('formFiller').checked,
		scroller = document.getElementById('scroller').checked,
		typer = document.getElementById('typer').checked,

		alert = document.getElementById('alert').checked,
		fps = document.getElementById('fps').checked,
		gizmo = document.getElementById('gizmo').checked,

		distribution = document.getElementById('distribution').checked,
		allTogether = document.getElementById('allTogether').checked,
		bySpecies = document.getElementById('bySpecies').checked,

	 species = [];
	if (clicker) {
		species.push('gremlins.species.clicker()');
	}
	if (toucher) {
		species.push('gremlins.species.toucher()');
	}
	if (formFiller) {
		species.push('gremlins.species.formFiller()');
	}
	if (scroller) {
		species.push('gremlins.species.scroller()');
	}
	if (typer) {
		species.push('gremlins.species.typer()');
	}

	const mogwais = [];
	if (alert) {
		mogwais.push('gremlins.mogwais.alert()');
	}
	if (fps) {
		mogwais.push('gremlins.mogwais.fps()');
	}
	if (gizmo) {
		mogwais.push('gremlins.mogwais.gizmo()');
	}

	const strategies = [];
	if (distribution) {
		strategies.push('gremlins.strategies.distribution()');
	}
	if (allTogether) {
		strategies.push('gremlins.strategies.allTogether()');
	}
	if (bySpecies) {
		strategies.push('gremlins.strategies.bySpecies()');
	}

	const bookmarkletCode = `
        javascript:(function() {
            function callback() {
                gremlins.createHorde({
                    species: [${species.join(',')}],
                    mogwais: [${mogwais.join(',')}],
                    strategies: [${strategies.join(',')}]
                }).unleash();
            }
            var s = document.createElement("script");
            s.src = "https://unpkg.com/gremlins.js";
            if (s.addEventListener) { s.addEventListener("load", callback, false); }
            else if (s.readyState) { s.onreadystatechange = callback; }
            document.body.appendChild(s);
        })()
    `;

	document.getElementById('bookmarklet').href = bookmarkletCode;
	document.getElementById('code').textContent = bookmarkletCode;
}

document.addEventListener('DOMContentLoaded', function () {
	document.getElementById('gremlins-form').addEventListener('input', setBookmarkletScript);
});
