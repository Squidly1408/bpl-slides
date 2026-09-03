import { LegalPage, Section } from '../components/LegalPage'

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="4 September 2026">
      <p>
        This Privacy Policy explains how BPL Slides handles information. The short version is simple: BPL Slides has
        no server and no accounts, so your work stays on your own device and we don't collect it. The detail below
        sets out the few limited exceptions and your rights, in plain English.
      </p>

      <Section heading="1. About this policy">
        <p>
          1.1 This policy applies to BPL Slides (the "Tool"), a free, student-built web application for Big Picture
          Learning work — Exhibition, Senior Portfolio, Gateway Project, and the IBPLC.
        </p>
        <p>
          1.2 In this policy, "we", "us" and "our" mean the individual creator(s) who build and host the Tool. "You"
          and "your" mean the person using it. "Personal information" has the meaning given in the Privacy Act 1988
          (Cth) — broadly, information or an opinion about an identified or reasonably identifiable individual.
        </p>
        <p>
          1.3 We aim to handle information consistently with the Privacy Act 1988 (Cth) and the Australian Privacy
          Principles ("APPs"), to the extent they apply to a project of this kind.
        </p>
      </Section>

      <Section heading="2. Not an official Big Picture product">
        <p>
          The Tool is an independent educational project. It is not run, hosted, or endorsed by Big Picture Learning
          Australia ("BPLA") or any Big Picture school unless and until they formally adopt it. This policy covers
          the Tool only — not BPLA, your school, or any third-party website you choose to embed or visit through it.
        </p>
      </Section>

      <Section heading="3. Everything stays on your device">
        <p>
          3.1 The Tool has no server and no user accounts. Every project, uploaded file, image, recording, drawing,
          and 3D model you add is stored locally in your browser, using a standard browser feature called IndexedDB.
        </p>
        <p>
          3.2 Nothing you upload or create is sent to us, or to anyone, at any point — we simply have no server to
          send it to. We do not receive, access, view, or store your Content.
        </p>
        <p>
          3.3 Because your Content lives only in one browser profile, clearing your browser's site data, using a
          private/incognito window, or switching devices or browsers will make your projects unavailable there. Use{' '}
          <strong>"Download project"</strong> regularly to save a backup file you control, and{' '}
          <strong>"Import project file"</strong> to restore it or move it to another device. You are responsible for
          keeping your own backups.
        </p>
      </Section>

      <Section heading="4. Offline use">
        <p>
          The Tool can be installed and used without an internet connection — handy on exhibition day if the wifi is
          unreliable. This works by caching the app's own code in your browser the first time you visit online (a
          "service worker"). It only ever caches the app itself — never your projects, which stay in IndexedDB as
          described above. You'll see a small "ready to work offline" notice the first time this happens.
        </p>
      </Section>

      <Section heading="5. What can leave your browser">
        <p>The Tool is designed to keep everything local. The limited exceptions are:</p>
        <p>
          5.1 <strong>Loading the app (hosting provider).</strong> When you first open the site, the app's own
          code — including the bundled Font Awesome icon set and KaTeX maths renderer — is delivered by our hosting
          provider, the same as any website. Like every web host, the hosting provider may automatically log
          standard technical information needed to serve the page, such as your IP address, the date and time of the
          request, and your browser type. We do not control this logging and do not use it to identify you; it is
          handled under the hosting provider's own privacy policy. We do not load fonts, analytics, icon sets, or
          libraries from any third-party CDN — everything the app needs ships inside the app itself.
        </p>
        <p>
          5.2 <strong>Embedded websites.</strong> If you add a "Showcase a website" / embed block with a URL, that
          website is loaded live inside your slide (and, when you present, in the presentation view). That
          third-party site can see that its page was loaded — the same as visiting it directly in a browser tab —
          and it handles any resulting information under its own privacy policy, not ours.
        </p>
        <p>
          5.3 <strong>Voice navigation (optional).</strong> If you turn on the optional voice-navigation feature,
          your microphone audio is sent to your browser's built-in speech-recognition service (for example, Google's,
          in Chrome) to detect commands like "next" and "back". This is the one feature that is not fully local and
          needs an internet connection. That service handles your audio under its own privacy policy. Voice
          navigation is off by default and can be turned off at any time with the mic toggle in Present mode.
        </p>
        <p>
          5.4 <strong>Maths tool.</strong> The "type an expression" mode renders entirely on your device via the
          bundled KaTeX library — nothing is sent anywhere. The "photo of maths" option is not analysed or converted;
          the image is simply stored like any other photo you upload and never leaves your browser.
        </p>
        <p>5.5 We do not add analytics, tracking scripts, advertising, or cookies of our own.</p>
      </Section>

      <Section heading="6. Overseas recipients">
        <p>
          Some third parties described in clause 5 — for example, the hosting provider or a browser speech-
          recognition service — may store or process technical information on servers located outside Australia.
          Where this happens, that information is handled under the relevant provider's own policies and the laws of
          the countries in which they operate. We do not ourselves send your Content overseas, because we do not
          receive it.
        </p>
      </Section>

      <Section heading="7. Children and students">
        <p>
          7.1 The Tool is designed for students and may be used by people under 18. It is built so that personal
          information stays on the user's own device and is not collected by us.
        </p>
        <p>
          7.2 If you are under 18, we encourage you to involve a parent, guardian, or teacher, especially before
          uploading personal work, using voice navigation, or embedding external websites.
        </p>
        <p>
          7.3 If you use a school-managed device or network, your school's own device, privacy, and acceptable-use
          policies also apply, and may involve monitoring or data handling that is outside our control.
        </p>
      </Section>

      <Section heading="8. Security">
        <p>
          Because your Content stays on your own device, its security depends largely on the security of that device
          and browser (for example, your device passcode and who else can access it). We take reasonable care with
          the app's code, but no method of storage is completely secure, and we cannot guarantee the security of
          information held on your device or transmitted to the third parties described in clause 5.
        </p>
      </Section>

      <Section heading="9. Accessing, correcting, and deleting your information">
        <p>9.1 Because we hold no personal information about you, there is generally nothing for us to access, correct, or delete on our side.</p>
        <p>
          9.2 You control your own data directly: you can view, edit, export, or permanently delete your projects at
          any time within the Tool or by clearing your browser's site data for the site.
        </p>
        <p>
          9.3 If you believe we hold any personal information about you and wish to access or correct it, contact us
          using the details below and we'll respond within a reasonable time.
        </p>
      </Section>

      <Section heading="10. Complaints and contact">
        <p>
          10.1 If you have a question, concern, or complaint about privacy and the Tool, please contact us at:{' '}
          <a href="mailto:Squidly1408@gmail.com" className="underline" style={{ color: 'var(--color-primary)' }}>
            Squidly1408@gmail.com
          </a>
          . We'll acknowledge your complaint and aim to respond within a reasonable time.
        </p>
        <p>
          10.2 If you are not satisfied with our response, you can contact the Office of the Australian Information
          Commissioner (OAIC) at{' '}
          <a href="https://www.oaic.gov.au" target="_blank" rel="noreferrer" className="underline" style={{ color: 'var(--color-primary)' }}>
            www.oaic.gov.au
          </a>
          .
        </p>
      </Section>

      <Section heading="11. Changes to this policy">
        <p>
          If this policy changes, the "Last updated" date above will change too. Continued use of the Tool after an
          update means you accept the revised policy.
        </p>
      </Section>
    </LegalPage>
  )
}
