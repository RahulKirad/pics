import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MarketingContentLayout } from '@/components/marketing/MarketingContentLayout';

export function ContactPage() {
  const [sent, setSent] = useState(false);

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <MarketingContentLayout
      eyebrow="Company"
      title="Contact us"
      description="Questions about plans, partnerships, or enterprise events? We typically reply within one business day."
      showCta={false}
      wide
    >
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-start">
        <aside className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1 text-sm text-[#64748b]">
          <div>
            <h2 className="text-base font-semibold text-[#0f172a]">Email</h2>
            <a href="mailto:hello@picsharenow.com" className="mt-1 block font-medium text-[#1d4ed8] hover:underline">
              hello@picsharenow.com
            </a>
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#0f172a]">Support hours</h2>
            <p className="mt-1">Monday – Friday, 10:00 – 18:00 IST</p>
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#0f172a]">Sales</h2>
            <p className="mt-1">Studios with 50+ events per year — ask about volume pricing and dedicated onboarding.</p>
          </div>
        </aside>
        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-[18px] border border-[#e6eaf3] bg-white p-6 shadow-[var(--landing-shadow)] lg:p-8"
        >
          {sent ? (
            <p className="rounded-md bg-[#eef3ff] px-4 py-3 text-sm text-[#0b2a8f]" role="status">
              Thanks for reaching out. For now this demo form does not send mail — email us at hello@picsharenow.com and we will
              connect you with the team.
            </p>
          ) : (
            <>
              <div className="space-y-2">
                <label htmlFor="contact-name" className="text-sm font-medium">
                  Name
                </label>
                <Input id="contact-name" name="name" required placeholder="Your name" autoComplete="name" />
              </div>
              <div className="space-y-2">
                <label htmlFor="contact-email" className="text-sm font-medium">
                  Email
                </label>
                <Input id="contact-email" name="email" type="email" required placeholder="you@studio.com" autoComplete="email" />
              </div>
              <div className="space-y-2">
                <label htmlFor="contact-subject" className="text-sm font-medium">
                  Subject
                </label>
                <Input id="contact-subject" name="subject" required placeholder="How can we help?" />
              </div>
              <div className="space-y-2">
                <label htmlFor="contact-message" className="text-sm font-medium">
                  Message
                </label>
                <Textarea id="contact-message" name="message" required rows={5} placeholder="Tell us about your studio or event." />
              </div>
              <Button type="submit" className="w-full sm:w-auto">
                Send message
              </Button>
            </>
          )}
        </form>
      </div>
    </MarketingContentLayout>
  );
}
