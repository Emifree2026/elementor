/**
 * Builds the build-composition payload for the Emifree contact section
 * (Elementor Pro atomic form) — EN or DE.
 *
 * Usage: node make-contact-composition.js <en|de> <dry_run:true|false> <outfile.json>
 */
const fs = require('fs');

const lang = process.argv[2] || 'en';
const dryRun = (process.argv[3] || 'true') === 'true';
const out = process.argv[4] || 'C:/Users/vpedr/.claude/projects/C--Users-vpedr/tooling/_args_contact_' + lang + '.json';

const T = {
    en: {
        formName: 'Emifree Contact (EN)',
        heading: 'Ready for cleaner air?',
        subheading: 'Plan your next filtration project with us and schedule a free consultation with our engineering team.',
        formTitle: 'Send us a message',
        name: 'Name',
        namePh: 'Your Name',
        email: 'Email',
        emailPh: 'Your Email',
        company: 'Company Name',
        companyPh: 'Company Name',
        message: 'Message',
        messagePh: 'Tell us about your project...',
        submit: 'Send Message',
        success: 'Thank you! We have received your message and will get back to you shortly.',
        error: 'Something went wrong. Please try again, or email us directly at info@emifree.com.',
        infoTitle: 'Get in touch',
        infoEmailTitle: 'Email Us',
        infoEmailText: 'info@emifree.com',
        infoEmailDesc: 'Send us an email anytime',
        infoPhoneTitle: 'Call Us',
        infoPhoneText: '+49 307 628 3520',
        infoPhoneDesc: 'Mon-Fri from 8am to 6pm',
        infoAddrTitle: 'Direction',
        infoAddrText: 'Pestalozzistraße 13',
        infoAddrDesc: '12557 Berlin, Germany.',
    },
    de: {
        formName: 'Emifree Contact (DE)',
        heading: 'Bereit für sauberere Luft?',
        subheading: 'Planen Sie Ihr nächstes Filtrationsprojekt mit uns und vereinbaren Sie eine kostenlose Beratung mit unserem Engineering-Team.',
        formTitle: 'Schreiben Sie uns eine Nachricht',
        name: 'Name',
        namePh: 'Ihr Name',
        email: 'E-Mail',
        emailPh: 'Ihre E-Mail',
        company: 'Firmenname',
        companyPh: 'Firmenname',
        message: 'Nachricht',
        messagePh: 'Erzählen Sie uns von Ihrem Projekt...',
        submit: 'Nachricht senden',
        success: 'Vielen Dank! Wir haben Ihre Nachricht erhalten und melden uns in Kürze.',
        error: 'Etwas ist schiefgelaufen. Bitte versuchen Sie es erneut oder schreiben Sie uns direkt an info@emifree.com.',
        infoTitle: 'Kontakt aufnehmen',
        infoEmailTitle: 'E-Mail an uns',
        infoEmailText: 'info@emifree.com',
        infoEmailDesc: 'Schreiben Sie uns jederzeit eine E-Mail',
        infoPhoneTitle: 'Rufen Sie uns an',
        infoPhoneText: '+49 307 628 3520',
        infoPhoneDesc: 'Mo bis Fr von 8 bis 18 Uhr',
        infoAddrTitle: 'Anfahrt',
        infoAddrText: 'Pestalozzistraße 13',
        infoAddrDesc: '12557 Berlin, Deutschland.',
    },
}[lang];

if (!T) {
    console.error('unknown language: ' + lang);
    process.exit(1);
}

const xml = `<e-flexbox configuration-id="contact-section"><e-flexbox configuration-id="contact-inner"><e-flexbox configuration-id="contact-header"><e-heading configuration-id="contact-title"></e-heading><e-paragraph configuration-id="contact-subtitle"></e-paragraph></e-flexbox><e-flexbox configuration-id="contact-columns"><e-div-block configuration-id="contact-form-card"><e-heading configuration-id="contact-form-title"></e-heading><e-form configuration-id="contact-form"><e-flexbox configuration-id="contact-row-name"><e-form-label configuration-id="contact-label-name"></e-form-label><e-form-input configuration-id="contact-field-name"></e-form-input></e-flexbox><e-flexbox configuration-id="contact-row-email"><e-form-label configuration-id="contact-label-email"></e-form-label><e-form-input configuration-id="contact-field-email"></e-form-input></e-flexbox><e-flexbox configuration-id="contact-row-company"><e-form-label configuration-id="contact-label-company"></e-form-label><e-form-input configuration-id="contact-field-company"></e-form-input></e-flexbox><e-flexbox configuration-id="contact-row-message"><e-form-label configuration-id="contact-label-message"></e-form-label><e-form-textarea configuration-id="contact-field-message"></e-form-textarea></e-flexbox><e-form-submit-button configuration-id="contact-submit"></e-form-submit-button><e-form-success-message configuration-id="contact-success"><e-paragraph configuration-id="contact-success-text"></e-paragraph></e-form-success-message><e-form-error-message configuration-id="contact-error"><e-paragraph configuration-id="contact-error-text"></e-paragraph></e-form-error-message></e-form></e-div-block><e-flexbox configuration-id="contact-info"><e-heading configuration-id="contact-info-title"></e-heading><e-div-block configuration-id="contact-info-email"><e-heading configuration-id="contact-info-email-title"></e-heading><e-paragraph configuration-id="contact-info-email-text"></e-paragraph><e-paragraph configuration-id="contact-info-email-desc"></e-paragraph></e-div-block><e-div-block configuration-id="contact-info-phone"><e-heading configuration-id="contact-info-phone-title"></e-heading><e-paragraph configuration-id="contact-info-phone-text"></e-paragraph><e-paragraph configuration-id="contact-info-phone-desc"></e-paragraph></e-div-block><e-div-block configuration-id="contact-info-address"><e-heading configuration-id="contact-info-address-title"></e-heading><e-paragraph configuration-id="contact-info-address-text"></e-paragraph><e-paragraph configuration-id="contact-info-address-desc"></e-paragraph></e-div-block></e-flexbox></e-flexbox></e-flexbox></e-flexbox>`;

const elementConfig = {
    'contact-section': {
        tag: 'section',
        _cssid: 'contact',
    },
    'contact-title': {
        tag: 'h2',
        title: T.heading,
    },
    'contact-subtitle': {
        tag: 'p',
        paragraph: T.subheading,
    },
    'contact-form-title': {
        tag: 'h3',
        title: T.formTitle,
    },
    'contact-form': {
        'form-name': T.formName,
        'actions-after-submit': ['email', 'collect-submissions'],
        'submissions_metadata': ['remote_ip', 'user_agent'],
        email: {
            to: ['contact.website@emifree.com'],
            from: 'info@emifree.com',
            'from-name': 'Emifree',
            subject: 'New contact form submission from Emifree',
            message: 'Name: [name]\nEmail: [email]\nCompany: [company]\n\nMessage:\n[message]',
            'reply-to': '[email]',
            'send-as': 'plain',
        },
    },
    'contact-label-name': {
        tag: 'label',
        text: T.name,
        'input-id': 'name',
    },
    'contact-field-name': {
        type: 'text',
        placeholder: T.namePh,
        required: true,
        autocomplete: true,
        _cssid: 'name',
    },
    'contact-label-email': {
        tag: 'label',
        text: T.email,
        'input-id': 'email',
    },
    'contact-field-email': {
        type: 'email',
        placeholder: T.emailPh,
        required: true,
        autocomplete: true,
        _cssid: 'email',
    },
    'contact-label-company': {
        tag: 'label',
        text: T.company,
        'input-id': 'company',
    },
    'contact-field-company': {
        type: 'text',
        placeholder: T.companyPh,
        required: true,
        autocomplete: true,
        _cssid: 'company',
    },
    'contact-label-message': {
        tag: 'label',
        text: T.message,
        'input-id': 'message',
    },
    'contact-field-message': {
        placeholder: T.messagePh,
        rows: 5,
        required: true,
        resizable: true,
        _cssid: 'message',
    },
    'contact-submit': {
        tag: 'button',
        text: T.submit,
    },
    'contact-success-text': {
        tag: 'p',
        paragraph: T.success,
    },
    'contact-error-text': {
        tag: 'p',
        paragraph: T.error,
    },
    'contact-info-title': {
        tag: 'h3',
        title: T.infoTitle,
    },
    'contact-info-email-title': { tag: 'h4', title: T.infoEmailTitle },
    'contact-info-email-text': {
        tag: 'p',
        paragraph: T.infoEmailText,
        link: { destination: 'mailto:' + T.infoEmailText, isTargetBlank: false, tag: 'a' },
    },
    'contact-info-email-desc': { tag: 'p', paragraph: T.infoEmailDesc },
    'contact-info-phone-title': { tag: 'h4', title: T.infoPhoneTitle },
    'contact-info-phone-text': {
        tag: 'p',
        paragraph: T.infoPhoneText,
        link: { destination: 'tel:' + T.infoPhoneText.replace(/[^0-9+]/g, ''), isTargetBlank: false, tag: 'a' },
    },
    'contact-info-phone-desc': { tag: 'p', paragraph: T.infoPhoneDesc },
    'contact-info-address-title': { tag: 'h4', title: T.infoAddrTitle },
    'contact-info-address-text': { tag: 'p', paragraph: T.infoAddrText },
    'contact-info-address-desc': { tag: 'p', paragraph: T.infoAddrDesc },
};

const inputStyle = 'width: 100%; height: auto; padding: 0.875rem 1rem; font-size: 1rem; color: #0f172a; background-color: #ffffff; border: 2px solid #e2e8f0; border-radius: 0.75rem; margin: 0; &::placeholder { color: #94a3b8; } &:focus { border-color: #1d4ed8; }';
const labelStyle = 'display: block; font-size: 0.875rem; font-weight: 600; color: #334155; margin: 0;';

const style = {
    'contact-section': 'display: flex; flex-direction: column; align-items: center; gap: 4rem; padding: 6rem 2rem; background: linear-gradient(135deg, #f8fafc 0%, #eff6ff 100%); @media(--mobile) { padding: 3rem 1.25rem; gap: 3rem; }',
    'contact-inner': 'display: flex; flex-direction: column; gap: 4rem; width: 100%; max-width: 1200px;',
    'contact-header': 'display: flex; flex-direction: column; align-items: center; gap: 1.5rem; text-align: center;',
    'contact-title': 'font-size: 3rem; line-height: 1.1; font-weight: 700; color: #18181b; margin: 0; @media(--mobile) { font-size: 2.25rem; }',
    'contact-subtitle': 'font-size: 1.25rem; line-height: 1.6; color: #52525b; margin: 0; max-width: 48rem; @media(--mobile) { font-size: 1.0625rem; }',
    'contact-columns': 'display: flex; flex-direction: row; gap: 3rem; align-items: flex-start; width: 100%; @media(--mobile) { flex-direction: column; }',
    'contact-form-card': 'display: flex; flex-direction: column; gap: 1.5rem; flex-grow: 1; flex-basis: 0; background-color: #ffffff; border-radius: 1.5rem; padding: 2.5rem; box-shadow: 0 20px 50px rgba(15, 23, 42, 0.08); @media(--mobile) { padding: 1.5rem; }',
    'contact-form-title': 'font-size: 1.5rem; font-weight: 700; color: #18181b; margin: 0;',
    'contact-form': 'display: flex; flex-direction: column; gap: 1.25rem; width: 100%; margin: 0; padding: 0;',
    'contact-row-name': 'display: flex; flex-direction: column; gap: 0.375rem; width: 100%;',
    'contact-row-email': 'display: flex; flex-direction: column; gap: 0.375rem; width: 100%;',
    'contact-row-company': 'display: flex; flex-direction: column; gap: 0.375rem; width: 100%;',
    'contact-row-message': 'display: flex; flex-direction: column; gap: 0.375rem; width: 100%;',
    'contact-label-name': labelStyle,
    'contact-label-email': labelStyle,
    'contact-label-company': labelStyle,
    'contact-label-message': labelStyle,
    'contact-field-name': inputStyle,
    'contact-field-email': inputStyle,
    'contact-field-company': inputStyle,
    'contact-field-message': inputStyle + ' min-height: 8rem;',
    'contact-submit': 'display: block; width: 100%; padding: 1rem 2.5rem; font-size: 1.125rem; font-weight: 600; color: #ffffff; background: linear-gradient(90deg, #1d4ed8 0%, #06b6d4 100%); border: none; border-radius: 0.75rem; cursor: pointer; box-shadow: 0 10px 25px rgba(6, 182, 212, 0.25); margin: 0; &::hover { box-shadow: 0 14px 30px rgba(6, 182, 212, 0.35); }',
    'contact-success-text': 'font-size: 0.875rem; color: #166534; margin: 0;',
    'contact-error-text': 'font-size: 0.875rem; color: #991b1b; margin: 0;',
    'contact-info': 'display: flex; flex-direction: column; gap: 1.5rem; flex-grow: 1; flex-basis: 0;',
    'contact-info-title': 'font-size: 1.5rem; font-weight: 700; color: #18181b; margin: 0;',
    'contact-info-email': 'display: flex; flex-direction: column; gap: 0.25rem; background-color: #ffffff; border-radius: 1rem; padding: 1.5rem; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);',
    'contact-info-phone': 'display: flex; flex-direction: column; gap: 0.25rem; background-color: #ffffff; border-radius: 1rem; padding: 1.5rem; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);',
    'contact-info-address': 'display: flex; flex-direction: column; gap: 0.25rem; background-color: #ffffff; border-radius: 1rem; padding: 1.5rem; box-shadow: 0 10px 30px rgba(15, 23, 42, 0.06);',
    'contact-info-email-title': 'font-size: 1.125rem; font-weight: 600; color: #0f172a; margin: 0;',
    'contact-info-phone-title': 'font-size: 1.125rem; font-weight: 600; color: #0f172a; margin: 0;',
    'contact-info-address-title': 'font-size: 1.125rem; font-weight: 600; color: #0f172a; margin: 0;',
    'contact-info-email-text': 'font-size: 1rem; font-weight: 600; color: #1d4ed8; margin: 0;',
    'contact-info-phone-text': 'font-size: 1rem; font-weight: 600; color: #1d4ed8; margin: 0;',
    'contact-info-address-text': 'font-size: 1rem; font-weight: 600; color: #0f172a; margin: 0;',
    'contact-info-email-desc': 'font-size: 0.875rem; color: #64748b; margin: 0;',
    'contact-info-phone-desc': 'font-size: 0.875rem; color: #64748b; margin: 0;',
    'contact-info-address-desc': 'font-size: 0.875rem; color: #64748b; margin: 0;',
};

const args = {
    post_id: 72,
    xml_structure: xml,
    element_config: elementConfig,
    style: style,
    classes: {},
    interactions: {},
    parent_id: 'document',
    mode: 'append',
    dry_run: dryRun,
};

fs.writeFileSync(out, JSON.stringify(args, null, 1));
console.log('wrote', out);
