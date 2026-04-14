import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { useState, useEffect } from "react";
import SearchableSelect from "@/components/ui/searchable-select";

interface BookAuthor {
  authorID: number | null;
  name: string;
  authorTypeID: number | null;
  authorRoleID: number | null;
}

interface AuthorOption {
  id: number;
  name: string;
  authorTypeID?: number | null;
}

interface Role {
  id: number;
  name: string;
}

interface AuthorAttribute {
  id: number;
  name: string;
}

interface AuthorsProps {
  formData: any;
  updateData: (key: string, value: any) => void;
  onRolesLoaded?: (roles: Role[]) => void;
  onTypesLoaded?: (types: AuthorAttribute[]) => void;
}

const emptyAuthor = (): BookAuthor => ({
  authorID: null,
  name: "",
  authorTypeID: null,
  authorRoleID: null,
});

export default function Authors({ formData, updateData, onRolesLoaded, onTypesLoaded }: AuthorsProps) {
  const authors: BookAuthor[] =
    formData.authors?.length ? formData.authors : [emptyAuthor()];

  const [apiRoles, setApiRoles] = useState<Role[]>([]);
  const [apiAttributes, setApiAttributes] = useState<AuthorAttribute[]>([]);
const [localAuthors, setLocalAuthors] = useState<AuthorOption[]>([]);


  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/AuthorRole", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const mapped = data.map((r: any) => ({ id: r.authorRoleID, name: r.roleName }));
        setApiRoles(mapped);
        onRolesLoaded?.(mapped);
      })
      .catch(() => setApiRoles([]));
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("token");
    fetch("/api/AuthorType", {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        const mapped = data.map((a: any) => ({ id: a.authorTypeID, name: a.authorTypeName }));
        setApiAttributes(mapped);
        onTypesLoaded?.(mapped);
      })
      .catch(() => setApiAttributes([]));
  }, []);

  const addAuthorRow = () => updateData("authors", [...authors, emptyAuthor()]);

  const removeAuthorRow = (index: number) => {
    const updated = authors.filter((_, i) => i !== index);
    updateData("authors", updated.length ? updated : [emptyAuthor()]);
  };

  const updateAuthor = (index: number, patch: Partial<BookAuthor>) => {
    const updated = [...authors];
    updated[index] = { ...updated[index], ...patch };
    updateData("authors", updated);
  };

const handleAuthorSelect = (index: number, option: AuthorOption | null) => {
  if (!option) {
    updateAuthor(index, { authorID: null, name: "", authorTypeID: null });
    return;
  }

  const matchedType = apiAttributes.find(
    (t) => t.name === (option as any).authorType
  );

  updateAuthor(index, {
    authorID: option.id && option.id !== 0 ? option.id : null,
    name: option.name,
    authorTypeID: matchedType?.id ?? null,
  });
};

 const getSelectedAuthor = (author: BookAuthor): AuthorOption | null => {
  if (!author?.name) return null;
  return { 
    id: author.authorID && author.authorID !== 0 ? author.authorID : 0,
    name: author.name, 
    authorTypeID: author.authorTypeID 
  };
};

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">المؤلفون</h3>
        <Button variant="outline" size="sm" onClick={addAuthorRow}>
          <Plus className="w-4 h-4 mr-1" /> إضافة صف جديد
        </Button>
      </div>

      <div className="space-y-4">
        {authors.map((author, index) => (
          <div key={index} className="border rounded-xl p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">
                مؤلف {index + 1}
                {author.name && (
                  <span className="text-xs text-muted-foreground mr-2">({author.name})</span>
                )}
              </span>
              {authors.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => removeAuthorRow(index)}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              <div className="space-y-2">
                <Label>الدور</Label>
                <Select
                  value={author.authorRoleID?.toString() ?? ""}
                  onValueChange={(val) => updateAuthor(index, { authorRoleID: Number(val) })}
                >
                  <SelectTrigger><SelectValue placeholder="اختر الدور" /></SelectTrigger>
                  <SelectContent>
                    {apiRoles.map(role => (
                      <SelectItem key={role.id} value={role.id.toString()}>{role.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>اسم المؤلف</Label>
                <SearchableSelect
                  searchEndpoint="/api/Book/authors/names"
                  searchParam="authorName"
                  value={getSelectedAuthor(author)}
                  onSelect={(opt) => handleAuthorSelect(index, opt as AuthorOption | null)}
                  placeholder="ابحث عن المؤلف..."
                  addPromptLabel="أدخل اسم المؤلف الجديد:"
                 localOptions={localAuthors}

                  onAdd={(name) => {
                    const newAuthor: AuthorOption = { id: 0, name: name.trim() };
                    setLocalAuthors(prev => [...prev, newAuthor]);
                   return newAuthor;
                       }}
                />
              </div>

              <div className="space-y-2">
                <Label>صفة المؤلف</Label>
                <Select
                  value={author.authorTypeID?.toString() ?? ""}
                  onValueChange={(val) => updateAuthor(index, { authorTypeID: Number(val) })}
                >
                  <SelectTrigger><SelectValue placeholder="اختر الصفة" /></SelectTrigger>
                  <SelectContent>
                    {apiAttributes.map(attr => (
                      <SelectItem key={attr.id} value={attr.id.toString()}>{attr.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

            </div>
          </div>
        ))}
      </div>
    </div>
  );
}