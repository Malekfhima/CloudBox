import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, Mail, MapPin, Phone } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { publicApi } from '@/src/api/public.api';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { Textarea } from '@/src/components/ui/textarea';
import { getErrorMessage } from '@/src/lib/utils';
import { contactSchema, type ContactFormValues } from '@/src/lib/validators';

export function ContactPage() {
  const [ticketId, setTicketId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
  });

  const onSubmit = async (values: ContactFormValues) => {
    try {
      const res = await publicApi.submitContact(values);
      setTicketId(res.ticketId);
      toast.success('Inquiry submitted.');
      reset();
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to submit contact form.'));
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="text-sm font-semibold text-blue-600">Contact CloudBox</p>
          <h1 className="mt-2 text-balance text-4xl font-bold tracking-tight text-slate-950">
            Let&rsquo;s configure the right storage plan for your team.
          </h1>
          <p className="mt-4 text-base text-slate-600">
            Reach out for custom Enterprise storage quotas, security questionnaires, or migration
            assistance.
          </p>

          <div className="mt-10 space-y-5 border-t border-slate-200 pt-8 text-sm text-slate-700">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 text-blue-600" />
              <div>
                <p className="font-semibold text-slate-900">Email</p>
                <p className="text-slate-600">enterprise@cloudbox.io</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-5 w-5 text-blue-600" />
              <div>
                <p className="font-semibold text-slate-900">Sales &amp; Onboarding</p>
                <p className="text-slate-600">+1 (415) 890-4420</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 text-blue-600" />
              <div>
                <p className="font-semibold text-slate-900">Headquarters</p>
                <p className="text-slate-600">548 Market Street, San Francisco, CA</p>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8">
            {ticketId ? (
              <div className="py-10 text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">Message received</h2>
                <p className="mt-2 text-sm text-slate-600">
                  Reference ID <span className="font-mono font-semibold">{ticketId}</span>. Our
                  solutions team will reply within 1 business day.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTicketId(null)}
                  className="mt-6"
                >
                  Send another message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="contact-name">Full name</Label>
                    <Input id="contact-name" placeholder="Elena Vance" {...register('name')} />
                    {errors.name ? (
                      <p className="text-xs text-red-600">{errors.name.message}</p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contact-email">Work email</Label>
                    <Input
                      id="contact-email"
                      type="email"
                      placeholder="elena@company.com"
                      {...register('email')}
                    />
                    {errors.email ? (
                      <p className="text-xs text-red-600">{errors.email.message}</p>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="contact-company">Company (optional)</Label>
                    <Input
                      id="contact-company"
                      placeholder="Northwind Studio"
                      {...register('company')}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contact-subject">Subject</Label>
                    <Input
                      id="contact-subject"
                      placeholder="Enterprise storage inquiry"
                      {...register('subject')}
                    />
                    {errors.subject ? (
                      <p className="text-xs text-red-600">{errors.subject.message}</p>
                    ) : null}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="contact-message">How can we help?</Label>
                  <Textarea
                    id="contact-message"
                    placeholder="Share your team size, storage requirements, or compliance questions..."
                    {...register('message')}
                  />
                  {errors.message ? (
                    <p className="text-xs text-red-600">{errors.message.message}</p>
                  ) : null}
                </div>

                <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? 'Sending...' : 'Send message'}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
