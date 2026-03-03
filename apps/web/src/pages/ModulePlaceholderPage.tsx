import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ModulePlaceholderPageProps {
  title: string;
  description?: string;
}

export function ModulePlaceholderPage({ title, description }: ModulePlaceholderPageProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">{title}</h2>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Este módulo está en construcción. Próximamente estará disponible.</p>
        </CardContent>
      </Card>
    </div>
  );
}
