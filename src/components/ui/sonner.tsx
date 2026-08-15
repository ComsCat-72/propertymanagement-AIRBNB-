import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      position="top-center"
      offset={16}
      duration={4000}
      visibleToasts={4}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast: "toast-glass",
          title: "font-semibold",
          description: "text-foreground/70",
          actionButton: "rounded-full bg-brand text-brand-foreground",
          cancelButton: "rounded-full bg-muted text-muted-foreground",
          success: "toast-glass-success",
          error: "toast-glass-error",
          warning: "toast-glass-warning",
          info: "toast-glass-info",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
