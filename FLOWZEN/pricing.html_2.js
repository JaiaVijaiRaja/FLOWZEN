
        // Smooth scroll for CTAs
        document.getElementById('btn-scroll-pricing').addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelector('#pricing').scrollIntoView({ behavior: 'smooth' });
        });

        // FAQ Toggle
        document.querySelectorAll('.faq-q').forEach(btn => {
            btn.addEventListener('click', () => {
                const item = btn.parentElement;
                const a = item.querySelector('.faq-a');
                
                // close others
                document.querySelectorAll('.faq-item').forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                        otherItem.querySelector('.faq-a').style.maxHeight = null;
                        otherItem.querySelector('ivi').textContent = '+';
                    }
                });

                item.classList.toggle('active');
                if (item.classList.contains('active')) {
                    a.style.maxHeight = a.scrollHeight + "px";
                    btn.querySelector('ivi').textContent = '—';
                } else {
                    a.style.maxHeight = null;
                    btn.querySelector('ivi').textContent = '+';
                }
            });
        });

        // Navbar Scroll 
        window.addEventListener('scroll', () => {
            const nav = document.getElementById('navbar');
            if (window.scrollY > 50) {
                nav.classList.add('scrolled');
            } else {
                nav.classList.remove('scrolled');
            }
        });

        // Initial fade in
        window.onload = () => {
            document.body.classList.add('loaded');
        };
    