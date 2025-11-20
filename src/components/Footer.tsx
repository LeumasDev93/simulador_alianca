import { PaymentSecurityLogosFooter } from "@/components/ui/PaymentSecurityLogosFooter";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <PaymentSecurityLogosFooter />
          <p className="text-sm text-gray-600">
            © {currentYear} Alianças Seguros. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}

