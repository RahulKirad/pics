import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Camera, QrCode, ScanFace, Images } from 'lucide-react';
import { Button } from '@/components/ui/button';

const steps = [
  { icon: QrCode, title: 'Scan QR', description: 'Guest scans the event QR code at the venue' },
  { icon: ScanFace, title: 'Take Selfie', description: 'Quick selfie for AI face matching' },
  { icon: Images, title: 'Get Photos', description: 'Personalized gallery with favorites and downloads' },
];

const features = [
  {
    title: 'AI Face Matching',
    description: 'Production-quality face recognition finds every photo of each guest automatically.',
  },
  {
    title: 'Bulk Upload',
    description: 'Upload thousands of photos with resumable chunked uploads and real-time progress.',
  },
  {
    title: 'Event Isolation',
    description: 'Strict tenant and event boundaries ensure guests only see their event photos.',
  },
  {
    title: 'Dual Storage',
    description: 'Run on your VPS or connect S3-compatible cloud storage with one configuration change.',
  },
];

export function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-20 md:px-6 md:py-32 lg:py-40">
          <div className="mx-auto max-w-3xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <p className="mb-4 text-sm font-medium uppercase tracking-widest text-muted-foreground">
                For Photographers & Event Studios
              </p>
              <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                Scan QR. Take a Selfie.
                <span className="block text-muted-foreground">Find Your Photos.</span>
              </h1>
              <p className="mb-8 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto">
                Deliver personalized photo galleries to every guest at your events.
                Powered by AI face recognition, built for professional photographers.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link to="/register">
                  <Button size="lg" className="w-full sm:w-auto">
                    Start Free Trial
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/how-it-works">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    See How It Works
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Hero visual */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="container mx-auto px-4 pb-20 md:px-6"
        >
          <div className="mx-auto max-w-5xl rounded-xl border bg-muted/30 aspect-[16/9] flex items-center justify-center">
            <div className="text-center p-8">
              <Camera className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Professional photo gallery preview</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* How it works preview */}
      <section className="border-t py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">Three steps for guests</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              No app download. No account required. Works on any mobile browser.
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="mb-4 mx-auto flex h-14 w-14 items-center justify-center rounded-full border bg-background">
                  <step.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features preview */}
      <section className="border-t bg-muted/30 py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">Built for professionals</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Enterprise-grade infrastructure with a guest experience that feels effortless.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="rounded-lg border bg-background p-6"
              >
                <h3 className="font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t py-20 md:py-28">
        <div className="container mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl mb-4">
            Ready to transform your events?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
            Create your first event in minutes. Upload photos, generate a QR code, and let AI do the rest.
          </p>
          <Link to="/register">
            <Button size="lg">
              Get Started Free
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>
    </>
  );
}
