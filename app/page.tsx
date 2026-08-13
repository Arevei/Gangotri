"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Box,
  CheckCircle2,
  Droplet,
  Flame,
  HeartHandshake,
  Home,
  Mail,
  MapPin,
  Mountain,
  Package,
  Phone,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Truck,
  X
} from "lucide-react";

type ProductKey = "500ml" | "1litre";

type Product = {
  key: ProductKey;
  name: string;
  shortName: string;
  price: number;
  tagline: string;
  image: string;
  description: string;
};

const products: Product[] = [
  {
    key: "500ml",
    name: "500 ml Gangajal",
    shortName: "500 ml",
    price: 499,
    tagline: "Daily puja",
    image: "/images/gangotri-crystal-cutout.png",
    description: "Ideal for daily puja, abhishek and personal spiritual use."
  },
  {
    key: "1litre",
    name: "1 Litre Gangajal",
    shortName: "1 Litre",
    price: 899,
    tagline: "Home temple",
    image: "/images/gangotri-kalash-cutout.png",
    description: "Perfect for home temples, special rituals and ceremonies."
  }
];

const initialQuantities: Record<ProductKey, number> = {
  "500ml": 0,
  "1litre": 0
};

const trustBadges = [
  { icon: Mountain, label: "Sourced with Care" },
  { icon: ShieldCheck, label: "Tamper-Sealed" },
  { icon: Tag, label: "Batch Identified" },
  { icon: Truck, label: "Delivered Across India" }
];

const journey = [
  {
    icon: Mountain,
    title: "Sacred Source",
    text: "Sourced from the glacier-fed waters of Gangotri."
  },
  {
    icon: Droplet,
    title: "Careful Collection",
    text: "Collected with tradition, cleanliness and deep respect."
  },
  {
    icon: Package,
    title: "Respectful Packing",
    text: "Packaged in pure, tamper-sealed sacred vessels."
  },
  {
    icon: Box,
    title: "Secure Delivery",
    text: "Delivered across India with care and integrity."
  }
];

const uses = [
  { icon: Flame, title: "Daily Puja", text: "Purifies your space and uplifts devotion." },
  { icon: Droplet, title: "Abhishek", text: "Ideal for offerings to Lord Shiva." },
  { icon: Sparkles, title: "Festivals & Rituals", text: "Essential for holy occasions and vows." },
  { icon: Home, title: "Home Temple", text: "Invites positivity and sacred energy." },
  { icon: HeartHandshake, title: "Spiritual Wellness", text: "For peace, clarity and inner purity." }
];

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0
});

export default function HomePage() {
  const [quantities, setQuantities] = useState(initialQuantities);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const selectedItems = useMemo(
    () => products.filter((product) => quantities[product.key] > 0),
    [quantities]
  );

  const total = useMemo(
    () => products.reduce((sum, product) => sum + product.price * quantities[product.key], 0),
    [quantities]
  );

  const updateQuantity = (key: ProductKey, change: number) => {
    setQuantities((current) => ({
      ...current,
      [key]: Math.max(0, Math.min(25, current[key] + change))
    }));
  };

  const openOrder = (key?: ProductKey) => {
    setQuantities((current) => {
      const hasItems = Object.values(current).some((quantity) => quantity > 0);
      const nextKey = key || "500ml";

      return {
        ...current,
        [nextKey]: key || !hasItems ? Math.max(1, current[nextKey]) : current[nextKey]
      };
    });
    setStatus("idle");
    setMessage("");
    setDialogOpen(true);
  };

  const closeDialog = () => {
    if (status !== "submitting") {
      setDialogOpen(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setStatus("submitting");
    setMessage("");

    if (selectedItems.length === 0) {
      setStatus("error");
      setMessage("Please select at least one Gangajal offering.");
      return;
    }

    const formData = new FormData(form);
    const payload = {
      customer: {
        name: String(formData.get("name") || ""),
        email: String(formData.get("email") || ""),
        phone: String(formData.get("phone") || ""),
        address: String(formData.get("address") || ""),
        city: String(formData.get("city") || ""),
        state: String(formData.get("state") || ""),
        pincode: String(formData.get("pincode") || ""),
        notes: String(formData.get("notes") || "")
      },
      items: products.map((product) => ({
        name: product.name,
        sku: product.key,
        quantity: quantities[product.key],
        price: currency.format(product.price)
      }))
    };

    try {
      const response = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Unable to place your preorder.");
      }

      setStatus("success");
      setMessage(`Preorder confirmed. Your booking ID is ${result.orderId}.`);
      form.reset();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unable to place your preorder.");
    }
  };

  return (
    <main className="site-shell">
      <OrderDialog
        closeDialog={closeDialog}
        dialogOpen={dialogOpen}
        handleSubmit={handleSubmit}
        message={message}
        quantities={quantities}
        selectedItems={selectedItems}
        status={status}
        total={total}
        updateQuantity={updateQuantity}
      />

      <div className="top-strip">
        <span>Authentic Gangajal</span>
        <span>Carefully Packed</span>
        <span>Delivered Across India</span>
      </div>

      <header className="site-header">
        <a href="#top" className="brand" aria-label="Gangotri home">
          Gangotri
        </a>
        <nav aria-label="Primary navigation">
          <a href="#offerings">Our Offerings</a>
          <a href="#journey">Sacred Journey</a>
          <a href="#uses">Sacred Uses</a>
        </nav>
        <button className="nav-cta" type="button" onClick={() => openOrder()}>
          Order Now
        </button>
      </header>

      <section id="top" className="hero">
        <div className="hero-background" aria-hidden="true">
          <Image src="/images/gangotri-day-hero-clean.png" alt="" fill priority sizes="100vw" />
        </div>
        <div className="hero-copy">
          <p className="eyebrow">Sacred · Authentic · Pure</p>
          <h1>
            Gangajal from the Heart of <em>Gangotri</em>
          </h1>
          <p>
            Pure Gangajal sourced from the pristine glaciers of Gangotri, preserved with devotion
            and delivered to your home with utmost care.
          </p>
          <div className="hero-actions">
            <button className="primary-button" type="button" onClick={() => openOrder()}>
              Order Gangajal <ArrowRight size={18} />
            </button>
            <a href="#journey" className="text-link">
              Discover Its Sacred Journey <ArrowUpRight size={16} />
            </a>
          </div>
        </div>

        {/* <div className="hero-gallery" aria-label="Gangotri product showcase">
          <Image src="/images/gangotri-crystal-cutout.png" alt="Crystal Gangajal vial" width={330} height={496} priority />
          <Image src="/images/gangotri-kalash-cutout.png" alt="Ornate Gangajal kalash" width={390} height={586} priority />
        </div> */}
      </section>

      <section className="trust-row" aria-label="Gangotri promises">
        {trustBadges.map((badge) => (
          <div key={badge.label}>
            <badge.icon size={28} strokeWidth={1.5} />
            <span>{badge.label}</span>
          </div>
        ))}
      </section>

      <section id="offerings" className="section offerings-section">
        <SectionHeading kicker="Choose Your" title="Sacred Offering" />
        <div className="product-grid">
          {products.map((product) => (
            <article className="product-card" key={product.key}>
              <div className="product-image">
                <Image src={product.image} alt={product.name} fill sizes="(max-width: 900px) 90vw, 300px" />
              </div>
              <div className="product-content">
                <p>{product.tagline}</p>
                <h3>{product.name}</h3>
                <span>{product.description}</span>
                <strong>{currency.format(product.price)}</strong>
                <div className="product-actions">
                  <QuantityControl
                    label={`${product.name} quantity`}
                    quantity={quantities[product.key]}
                    onDecrease={() => updateQuantity(product.key, -1)}
                    onIncrease={() => updateQuantity(product.key, 1)}
                  />
                  <button className="cart-button" type="button" onClick={() => openOrder(product.key)}>
                  <ShoppingBag size={16} /> Add to Cart
                </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="journey" className="journey">
        <div className="journey-image">
          <Image src="/images/gangotri-river.jpg" alt="Gangotri temple by a Himalayan river" fill sizes="(max-width: 900px) 100vw, 45vw" />
        </div>
        <div className="journey-copy">
          <p className="section-kicker">The Sacred Journey</p>
          <h2>From Gangotri to Your Home</h2>
          <p>Our sacred journey ensures purity at every step, handled with devotion and delivered with trust.</p>
          <div className="journey-steps">
            {journey.map((step, index) => (
              <div className="journey-step" key={step.title}>
                <span>0{index + 1}</span>
                <step.icon size={28} strokeWidth={1.5} />
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="devotion-band" aria-label="Gangotri devotion message">
        <Image src="/images/gangotri-night-banner-clean.png" alt="" fill sizes="100vw" />
        <div>
          <h2>Packed with care and purity, from the heart of Gangotri.</h2>
          <span />
        </div>
      </section>

      <section id="uses" className="section uses-section">
        <SectionHeading kicker="Rituals & Devotion" title="Sacred Uses" />
        <div className="uses-grid">
          {uses.map((use) => (
            <article key={use.title}>
              <use.icon size={30} strokeWidth={1.5} />
              <h3>{use.title}</h3>
              <p>{use.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="final-cta">
        <Image src="/images/gangotri-river.jfif" alt="" fill sizes="100vw" aria-hidden="true" />
        <div>
          <p className="eyebrow">Bring the Sacred Home</p>
          <h2>
            Bring the Sacred Presence of <em>Maa Ganga</em> Home.
          </h2>
          <p>
            Order authentic Gangajal today and experience purity you can trust, booked with devotion
            and delivered with care.
          </p>
          <button className="gold-button" type="button" onClick={() => openOrder()}>
            Order Gangajal Now <ArrowRight size={18} />
          </button>
        </div>
      </section>

      <footer className="site-footer">
        <strong>Gangotri</strong>
        <span>© {new Date().getFullYear()} Gangotri · Sacred Gangajal · Made with devotion</span>
        <button type="button" onClick={() => openOrder()}>
          Order
        </button>
      </footer>
    </main>
  );
}

function SectionHeading({ kicker, title }: { kicker: string; title: string }) {
  return (
    <div className="section-heading">
      <p className="section-kicker">{kicker}</p>
      <h2>{title}</h2>
      <span />
    </div>
  );
}

function QuantityControl({
  label,
  onDecrease,
  onIncrease,
  quantity
}: {
  label: string;
  onDecrease: () => void;
  onIncrease: () => void;
  quantity: number;
}) {
  return (
    <div className="quantity-control" aria-label={label}>
      <button type="button" onClick={onDecrease} aria-label="Decrease quantity">
        -
      </button>
      <output>{quantity}</output>
      <button type="button" onClick={onIncrease} aria-label="Increase quantity">
        +
      </button>
    </div>
  );
}

function OrderDialog({
  closeDialog,
  dialogOpen,
  handleSubmit,
  message,
  quantities,
  selectedItems,
  status,
  total,
  updateQuantity
}: {
  closeDialog: () => void;
  dialogOpen: boolean;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  message: string;
  quantities: Record<ProductKey, number>;
  selectedItems: Product[];
  status: "idle" | "submitting" | "success" | "error";
  total: number;
  updateQuantity: (key: ProductKey, change: number) => void;
}) {
  if (!dialogOpen) {
    return null;
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={closeDialog}>
      <section
        className="order-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="order-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button className="dialog-close" type="button" onClick={closeDialog} aria-label="Close preorder form">
          <X size={18} />
        </button>
        <div className="dialog-visual">
          <Image src="/images/gangotri-kalash-cutout.png" alt="Gangotri kalash" width={260} height={390} />
          <div>
            <span>Book Now · Pay Later</span>
            <strong>No online payment needed</strong>
          </div>
        </div>

        <form className="dialog-form" onSubmit={handleSubmit}>
          <div className="dialog-scroll">
            <div className="dialog-heading">
              <p className="section-kicker">Pre-Order</p>
              <h2 id="order-title">Reserve Your Gangajal</h2>
              <span>We will confirm payment and delivery after your booking.</span>
            </div>

            <div className="dialog-products">
              {selectedItems.length > 0 ? (
                selectedItems.map((product) => (
                  <div className="dialog-product" key={product.key}>
                    <div>
                      <strong>{product.name}</strong>
                      <span>{currency.format(product.price)}</span>
                    </div>
                    <QuantityControl
                      label={`${product.name} modal quantity`}
                      quantity={quantities[product.key]}
                      onDecrease={() => updateQuantity(product.key, -1)}
                      onIncrease={() => updateQuantity(product.key, 1)}
                    />
                  </div>
                ))
              ) : (
                <p className="empty-cart">Your cart is empty. Add a Gangajal offering to continue.</p>
              )}
            </div>

            <label>
              Full Name*
              <span><Home size={16} /><input name="name" required placeholder="Your name" /></span>
            </label>
            <div className="field-row">
              <label>
                Phone*
                <span><Phone size={16} /><input name="phone" required inputMode="tel" placeholder="10-digit mobile" /></span>
              </label>
              <label>
                Email*
                <span><Mail size={16} /><input type="email" name="email" required placeholder="you@email.com" /></span>
              </label>
            </div>
            <label>
              Address*
              <span><MapPin size={16} /><input name="address" required placeholder="House no, street, area" /></span>
            </label>
            <div className="field-row">
              <label>
                City*
                <input name="city" required placeholder="City" />
              </label>
              <label>
                State*
                <input name="state" required placeholder="State" />
              </label>
              <label>
                Pincode*
                <input name="pincode" required inputMode="numeric" placeholder="6-digit" />
              </label>
            </div>
            <label>
              Notes
              <textarea name="notes" rows={3} placeholder="Any special request" />
            </label>
          </div>

          <div className="dialog-sticky-footer">
            <div className="dialog-total">
              <span>Total (pay on delivery)</span>
              <strong>{currency.format(total)}</strong>
            </div>
            <button className="submit-button" type="submit" disabled={status === "submitting"}>
              {status === "submitting" ? "Confirming..." : "Confirm Pre-Order"} <ArrowRight size={18} />
            </button>
            {message && (
              <p className={`form-message ${status}`}>
                {status === "success" && <CheckCircle2 size={18} />}
                {message}
              </p>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
