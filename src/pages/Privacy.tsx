import { LegalPage, Section } from '../components/LegalPage'

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="4 September 2026">
      <Section heading="A tool built for Big Picture Learning">
        <p>
          BPL Slides is a student-built tool designed for Big Picture Learning students, aligned with Big Picture
          Learning Australia's published framework — Exhibition, Senior Portfolio, Gateway Certificate, and the
          IBPLC. It is offered as a potential tool for Big Picture schools, but it is not currently an official BPLA
          product, and isn't run, hosted, or endorsed by BPLA or any Big Picture school unless/until adopted by them.
        </p>
      </Section>

      <Section heading="Everything stays on your device">
        <p>
          BPL Slides has no server and no accounts. Every project, uploaded file, image, recording, drawing, and 3D
          model you add is stored locally in your browser (using a browser feature called IndexedDB). Nothing you
          upload or create is sent to us, or to anyone, at any point — we simply have no server to send it to.
        </p>
        <p>
          Because everything lives only in this browser profile, clearing your browser's site data, using a private
          window, or switching devices/browsers will make your projects unavailable there. Use the{' '}
          <strong>"Download project"</strong> button regularly to save a backup file you control, and use{' '}
          <strong>"Import project file"</strong> to bring it back or move it to another device.
        </p>
      </Section>

      <Section heading="Offline use">
        <p>
          BPL Slides can be installed and used without an internet connection — useful on exhibition day if the wifi
          is unreliable. This works by caching the app's own code in your browser the first time you visit online (a
          "service worker"); it only ever caches the app itself, never your projects, which already live in
          IndexedDB as described above. You'll see a small "ready to work offline" notice the first time this
          happens.
        </p>
      </Section>

      <Section heading="What can leave your browser">
        <ul className="list-disc space-y-1 pl-5">
          <li>
            The app's own code (including the bundled Font Awesome icon set and KaTeX maths renderer, both used for
            the Icon and Maths tools below) is loaded from the hosting provider when you first open the site — the
            same as any website. We don't load fonts, analytics, icon sets, or libraries from any third-party CDN;
            everything the app needs ships in the app itself, so it also works offline once installed.
          </li>
          <li>
            If you add a "Showcase a website" / embed block with a URL, that website is loaded live inside your
            slide (and, when you present, in the presentation view). That third-party site can see that its page was
            loaded, per its own privacy policy — the same as visiting it directly in a browser tab.
          </li>
          <li>
            If you use the optional voice-navigation feature, your microphone audio is sent to your browser's
            built-in speech recognition service (e.g. Google's, in Chrome) to detect words like "next" and "back" —
            this is the one feature in the app that isn't fully local, and it needs an internet connection to work.
            It's off by default; turn it off any time with the mic toggle in Present mode.
          </li>
          <li>
            The Maths tool's "type an expression" mode renders entirely on your device (via the bundled KaTeX
            library) — nothing is sent anywhere. Its "photo of maths" option is not analysed or converted in any way;
            it's stored as a plain image, exactly like any other photo you upload, and never leaves your browser.
          </li>
        </ul>
        <p>We do not add analytics, tracking scripts, or cookies of our own.</p>
      </Section>

      <Section heading="Students and school devices">
        <p>
          BPL Slides does not collect or transmit personal information itself. If you're using a school-managed
          device or network, your school's own device and acceptable-use policies still apply.
        </p>
      </Section>

      <Section heading="Changes to this policy">
        <p>
          If this policy changes, the "Last updated" date above will change too. Continued use after an update means
          you accept the revised policy.
        </p>
      </Section>
    </LegalPage>
  )
}
