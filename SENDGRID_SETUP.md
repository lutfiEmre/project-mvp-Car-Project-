# SendGrid Kurulum Rehberi

## 1. SendGrid Hesabı Oluşturma
1. https://sendgrid.com adresine gidin
2. Ücretsiz hesap oluşturun (ayda 100 email ücretsiz)

## 2. API Key Oluşturma
1. SendGrid Dashboard → Settings → API Keys
2. "Create API Key" butonuna tıklayın
3. API Key Name: "CarHaus Production" (veya istediğiniz isim)
4. Permissions: "Full Access" seçin (veya sadece "Mail Send" seçin)
5. "Create & View" butonuna tıklayın
6. **ÖNEMLİ**: API Key'i kopyalayın ve güvenli bir yere kaydedin (bir daha gösterilmeyecek!)

## 3. Sender Verification (Email Doğrulama)

### Seçenek 1: Single Sender Verification (Hızlı, Test için)
1. SendGrid Dashboard → Settings → Sender Authentication → Single Sender Verification
2. "Create New Sender" butonuna tıklayın
3. Formu doldurun:
   - **From Email**: `noreply@carhaus.ca` (veya kullanmak istediğiniz email)
   - **From Name**: `CarHaus` (veya istediğiniz isim)
   - **Reply To**: Aynı email veya farklı bir email
   - **Address**: İş adresiniz
   - **City**: Şehir
   - **State**: Eyalet/İl
   - **Country**: Ülke
   - **Company Name**: CarHaus
4. "Create" butonuna tıklayın
5. SendGrid size bir doğrulama email'i gönderecek
6. Email'i açın ve "Verify Single Sender" linkine tıklayın
7. ✅ Doğrulandıktan sonra bu email'i FROM_EMAIL olarak kullanabilirsiniz

### Seçenek 2: Domain Authentication (Önerilen, Production için)
1. SendGrid Dashboard → Settings → Sender Authentication → Domain Authentication
2. "Authenticate Your Domain" butonuna tıklayın
3. Domain'inizi girin: `carhaus.ca`
4. DNS Provider seçin (GoDaddy, Namecheap, vs.)
5. SendGrid size DNS kayıtları verecek (CNAME kayıtları)
6. Bu DNS kayıtlarını domain'inizin DNS ayarlarına ekleyin
7. DNS kayıtları doğrulandıktan sonra (birkaç saat sürebilir):
   - ✅ O domain'deki **herhangi bir email**'i FROM_EMAIL olarak kullanabilirsiniz
   - Örnek: `noreply@carhaus.ca`, `info@carhaus.ca`, `support@carhaus.ca` hepsi çalışır

## 4. Environment Variables (.env dosyası)

`.env` dosyanıza şu değişkenleri ekleyin:

```env
# SendGrid Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@carhaus.ca
SENDGRID_FROM_NAME=CarHaus
FRONTEND_URL=http://localhost:3000
```

### Açıklamalar:
- **SENDGRID_API_KEY**: SendGrid dashboard'dan aldığınız API key (SG. ile başlar)
- **SENDGRID_FROM_EMAIL**: Verified sender email veya domain authentication sonrası domain'deki herhangi bir email
- **SENDGRID_FROM_NAME**: Email'lerde görünecek gönderen ismi (marka adı)
- **FRONTEND_URL**: Frontend URL'iniz (password reset linkleri için)

## 5. Test Etme

1. Admin Settings → Email → "Send Test Email" butonuna tıklayın
2. Email adresinizi girin
3. Test email'i kontrol edin

## 6. Önemli Notlar

- **Single Sender Verification**: Sadece o email'i kullanabilirsiniz
- **Domain Authentication**: O domain'deki tüm email'leri kullanabilirsiniz (önerilen)
- **Production**: Domain authentication kullanmanız önerilir
- **Rate Limits**: Ücretsiz plan: 100 email/gün, 40,000 email/ay
- **Spam**: Email'lerin spam'e düşmemesi için domain authentication önemlidir

## 7. Troubleshooting

### Email gönderilmiyor?
- API key'in doğru olduğundan emin olun
- Sender email'in verified olduğundan emin olun
- Spam klasörünü kontrol edin
- SendGrid dashboard'da Activity → Email Activity'yi kontrol edin

### "Sender email not verified" hatası?
- Single Sender Verification yapın veya
- Domain Authentication yapın

### Email'ler spam'e düşüyor?
- Domain Authentication yapın (SPF, DKIM kayıtları)
- SendGrid'de "Sender Reputation" kontrol edin

