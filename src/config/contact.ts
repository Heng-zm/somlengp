// Centralized contact and email template content
export const CONTACT = {
  brandName: "Somleng",
  email: "hello@somleng.com",
  phoneDisplay: "+1 (555) 123-4567",
  phoneLink: "+15551234567",
  address: "123 Tech Street, San Francisco, CA 94105",
  hours: "Monday to Friday, 9:00 AM – 6:00 PM PST",
};

export const EMAIL_TEMPLATE_DEFAULT = {
  type: "welcome" as const,
  subject: "Welcome to SomlengP!",
  content: {
    title: "Welcome to Our Community!",
    body: "<p>Hi there!</p><p>We're thrilled to have you join our community. Your account has been successfully created, and you're now ready to explore everything we have to offer.</p>",
    buttonText: "Get Started",
    buttonUrl: "https://example.com/get-started",
    secondaryText: "Need help? Contact our support team anytime.",
  },
  options: {
    companyName: "SomlengP",
    primaryColor: "#1a73e8",
    accentColor: "#34a853",
    footerText: "Thanks for joining us!",
  },
};
