import { useEffect } from "react";
import ServicePrintSheet from "./service-print-sheet";
import { Dialog, DialogContent } from "./ui/dialog";

interface ServicePrintSheetModalProps {
  open: boolean;
  onClose: () => void;
  service: any;
  client: any;
  vehicle: any;
  employee: any;
  pagos: any[];
}

export default function ServicePrintSheetModal({ open, onClose, service, client, vehicle, employee, pagos }: ServicePrintSheetModalProps) {
  // Manejar la clase 'dialog-open' en el body para ocultar la barra flotante móvil
  useEffect(() => {
    if (open) {
      document.body.classList.add("dialog-open")
    } else {
      document.body.classList.remove("dialog-open")
    }
    return () => {
      document.body.classList.remove("dialog-open")
    }
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full">
        <ServicePrintSheet
          service={service}
          client={client}
          vehicle={vehicle}
          employee={employee}
          pagos={pagos}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}
