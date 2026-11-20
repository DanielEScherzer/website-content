(() => {

const onLoad = () => {
	const wrapper = document.querySelector('.btn-theme-toggle--wrapper');
	if (wrapper) {
		wrapper.style.display = '';
	}
	const toggleBtn = document.getElementById('btn-theme-toggle');
	const root = document.documentElement;

	// Load saved preference if it exists
	const savedTheme = localStorage.getItem('theme');
	if (savedTheme) {
		root.setAttribute('data-theme', savedTheme);
	} else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
		root.setAttribute('data-theme', 'dark');
	}

	const onClick = () => {
		const isDark = root.getAttribute('data-theme') === 'dark' || 
			(!root.hasAttribute('data-theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);

		const nextTheme = isDark ? 'light' : 'dark';
		root.setAttribute('data-theme', nextTheme);
		localStorage.setItem('theme', nextTheme);
	};

	toggleBtn.addEventListener( 'click', onClick );

};

document.addEventListener( 'DOMContentLoaded', onLoad );
})();
