import { LegalPage, Section } from '../components/LegalPage'

export default function Terms() {
  return (
    <LegalPage title="Terms & Conditions" updated="4 September 2026">
      <Section heading="What this is">
        <p>
          BPL Slides is a student-built tool for assembling and presenting Big Picture Learning work — Exhibition,
          Senior Portfolio, Gateway Certificate, and IBPLC decks. It's built as a potential tool for Big Picture
          schools and aligned with BPLA's published framework, but it is not currently an official Big Picture
          Learning Australia product and carries no endorsement from BPLA or any Big Picture school unless/until
          adopted by them. Every template is a generic, editable starting point — check your own school's actual
          exhibition and portfolio requirements with your advisor.
        </p>
      </Section>

      <Section heading="Provided as-is">
        <p>
          This tool is provided free, "as is", with no warranty of any kind. It's a personal/educational project, not
          a commercial or officially supported product. To the extent the law allows, we're not liable for lost work,
          missed deadlines, or any other loss or damage from using it.
        </p>
      </Section>

      <Section heading="Your content stays yours">
        <p>
          Everything you upload or create — documents, images, video, audio, drawings, 3D models, and the slides you
          build from them — is stored only in your own browser and remains entirely yours. We claim no rights over
          it, because it never reaches us.
        </p>
      </Section>

      <Section heading="Back up your own work">
        <p>
          Because there is no server-side storage, your browser is the only copy unless you export one. Please use
          the <strong>"Download project"</strong> file (and/or "Export .pptx") regularly, especially before an
          exhibition — clearing browser data, browser bugs, or switching devices can otherwise make a project
          unavailable. Don't treat this tool as your only backup of important work.
        </p>
      </Section>

      <Section heading="Acceptable use">
        <ul className="list-disc space-y-1 pl-5">
          <li>Only upload files and media you have the right to use.</li>
          <li>Don't use the website-embed feature to present harmful, illegal, or deceptive content.</li>
          <li>Don't try to disrupt, reverse-engineer for malicious purposes, or attack the hosting infrastructure.</li>
        </ul>
      </Section>

      <Section heading="Auto-generated slides">
        <p>
          The "upload work to auto-fill slides" feature uses simple, offline heuristics (splitting on headings,
          pulling out embedded images/text) — it is not AI-generated and does not judge quality or accuracy. Always
          review and edit auto-created slides before presenting.
        </p>
      </Section>

      <Section heading="The Learning Flower and IBPLC scorecard">
        <p>
          The Flower graphic and the Learning-Goal progression levels (1-5) it and the IBPLC slide use are a starting
          point for you to fill in with your own, real levels — not an official record of your progress. Your actual
          IBPLC — the assessed progression score, portfolio, video statement, and advisor narrative — is issued by
          Big Picture Learning Australia through your school and your BPLA Learner Profile, not by this app.
        </p>
      </Section>

      <Section heading="Third-party components used">
        <p>
          The Icon tool is built on the Font Awesome Free icon set and the Maths tool on the KaTeX library, both
          bundled with the app under their own open-source licenses (Font Awesome Free: icons CC BY 4.0, code MIT;
          KaTeX: MIT). Neither is loaded from the internet at runtime — both ship inside the app itself.
        </p>
      </Section>

      <Section heading="Changes">
        <p>
          These terms may be updated from time to time; the "Last updated" date above reflects the latest version.
          Continuing to use BPL Slides after a change means you accept the update.
        </p>
      </Section>
    </LegalPage>
  )
}
