import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, ExternalLink } from 'lucide-react';

const MyWebsites = ({ user }) => {
  const [websites, setWebsites] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWebsites = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/websites`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setWebsites(data);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWebsites();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50" data-testid="my-websites-page">
      <Navbar user={user} />
      
      <div className="container mx-auto px-4 md:px-8 max-w-7xl pt-24 pb-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="page-title">مواقعي</h1>
          <p className="text-gray-600">جميع المواقع الجاهزة الخاصة بك</p>
        </div>

        {loading ? (
          <div className="text-center py-12">جاري التحميل...</div>
        ) : websites.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Globe className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">لا توجد مواقع جاهزة بعد</h3>
              <p className="text-gray-600">بمجرد اكتمال طلباتك، ستظهر مواقعك هنا</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {websites.map((website) => (
              <Card key={website.id} className="overflow-hidden hover:shadow-lg transition-shadow" data-testid={`website-card-${website.id}`}>
                {website.preview_image && (
                  <img src={website.preview_image} alt={website.url} className="w-full h-48 object-cover" />
                )}
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{website.url}</h3>
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`status-badge status-${website.status}`}>
                      {website.status === 'draft' ? 'مسودة' : 'منشور'}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(website.created_at).toLocaleDateString('ar-SA')}
                    </span>
                  </div>
                  <Button variant="outline" className="w-full" asChild>
                    <a href={website.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 me-2" />
                      زيارة الموقع
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyWebsites;
