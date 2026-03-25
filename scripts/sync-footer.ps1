$footer = @"
    <!-- FOOTER -->
    <footer class="footer">
        <div class="container">
            <!-- Rândul 1: Brand + Linkuri -->
            <div class="footer-main">
                <div class="footer-brand">
                    <div class="footer-logo">
                        <span>🐾</span> FluffyPaws
                    </div>
                    <p>Conectăm suflete necuvântătoare cu familii iubitoare din 2020. Fiecare adopție contează.</p>
                    <div class="footer-social">
                        <a href="#" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
                        <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
                        <a href="#" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
                        <a href="#" aria-label="YouTube"><i class="fab fa-youtube"></i></a>
                    </div>
                </div>
                <div class="footer-column footer-spacer" aria-hidden="true"></div>
                <div class="footer-column footer-spacer" aria-hidden="true"></div>
                <div class="footer-column">
                    <h4>Contact</h4>
                    <ul>
                        <li><a href="tel:+40712345678"><i class="fas fa-phone"></i> +40 712 345 678</a></li>
                        <li><a href="mailto:contact@fluffypaws.ro"><i class="fas fa-envelope"></i>
                                contact@fluffypaws.ro</a></li>
                        <li><a href="#"><i class="fas fa-map-marker-alt"></i> București, România</a></li>
                    </ul>
                </div>
            </div>

            <!-- Rândul 2: Hartă + Program -->
            <div class="footer-info-row">

                <div class="open-times">
                    <div class="program-status">
                        <h3>Magazinul este: <span id="status-program">Se verifică...</span></h3>
                    </div>
                    <h4>Program de lucru</h4>
                    <ul>
                        <li>Luni – Vineri: 08:00 – 16:00</li>
                        <li>Sâmbătă – Duminică: 08:00 – 12:00</li>
                    </ul>
                </div>
                <div class="map-container">
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d503.4922716183288!2d26.07887171913752!3d44.44993101618476!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sro!2sro!4v1772448026517!5m2!1sro!2sro"
                        width="600" height="220" style="border:0;" allowfullscreen="" loading="lazy"
                        referrerpolicy="no-referrer-when-downgrade"></iframe>
                </div>
            </div>

            <div class="footer-bottom">
                <p>&copy; 2026 FluffyPaws. Toate drepturile rezervate. Realizat cu ❤️ pentru animale.</p>
            </div>
        </div>
    </footer>
"@

$files = @(
    'index.html',
    'about.html',
    'contact.html',
    'success-stories.html',
    'animal-details.html',
    'adoption-form.html',
    'profile.html'
)

foreach ($file in $files) {
    $content = Get-Content -Path $file -Raw
    $start = $content.IndexOf('<!-- FOOTER -->')
    if ($start -lt 0) { continue }
    $end = $content.IndexOf('</footer>', $start)
    if ($end -lt 0) { continue }
    $afterStart = $end + '</footer>'.Length
    $newContent = $content.Substring(0, $start) + $footer + $content.Substring($afterStart)
    Set-Content -Path $file -Value $newContent -Encoding utf8
}
