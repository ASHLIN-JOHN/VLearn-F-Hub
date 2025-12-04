"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Trophy, Download, Share2, Calendar } from "lucide-react"
import { useAuth } from "./auth-provider"

interface Course {
  id: string
  title: string
  description: string
  topics: string[]
  progress: number
  completed: boolean
  icon: string
  user_id: string
  created_at: string
}

interface CertificateModuleProps {
  course: Course
}

export function CertificateModule({ course }: CertificateModuleProps) {
  const { user } = useAuth()
  const studentName = user?.name || "Student"
  
  const currentDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const handleDownload = () => {
    // Create a comprehensive certificate HTML that can be printed as PDF
    const certificateHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Certificate - ${course.title}</title>
        <meta charset="UTF-8">
        <style>
          @page {
            size: A4 landscape;
            margin: 20mm;
          }
          * {
            box-sizing: border-box;
          }
          body { 
            font-family: 'Georgia', 'Times New Roman', serif; 
            margin: 0; 
            padding: 0; 
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .certificate { 
            width: 100%;
            max-width: 1000px; 
            background: white;
            padding: 60px; 
            border: 12px solid #4f46e5; 
            border-radius: 20px;
            text-align: center; 
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            position: relative;
            overflow: hidden;
          }
          .certificate::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="%23f8f9fa" opacity="0.1"/><circle cx="75" cy="75" r="1" fill="%23f8f9fa" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>') repeat;
            pointer-events: none;
          }
          .content {
            position: relative;
            z-index: 1;
          }
          .header { 
            margin-bottom: 40px; 
            border-bottom: 3px solid #4f46e5;
            padding-bottom: 20px;
          }
          .title { 
            font-size: 56px; 
            color: #4f46e5; 
            margin-bottom: 15px; 
            font-weight: bold; 
            text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
            letter-spacing: 2px;
          }
          .subtitle { 
            font-size: 22px; 
            color: #666; 
            font-style: italic;
            margin-bottom: 10px;
          }
          .recipient { 
            margin: 50px 0; 
            padding: 30px;
            background: linear-gradient(45deg, #f8f9fa, #e9ecef);
            border-radius: 15px;
            border: 2px solid #4f46e5;
          }
          .student-name { 
            font-size: 42px; 
            color: #4f46e5; 
            font-weight: bold; 
            margin: 25px 0; 
            text-decoration: underline;
            text-decoration-color: #4f46e5;
            text-underline-offset: 8px;
          }
          .course-title { 
            font-size: 28px; 
            margin: 25px 0; 
            font-weight: bold; 
            color: #2c3e50;
            font-style: italic;
          }
          .details { 
            margin: 50px 0; 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 40px; 
            text-align: left; 
          }
          .topics { 
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            border-left: 5px solid #4f46e5;
          }
          .completion-info { 
            text-align: center; 
            background: #f8f9fa;
            padding: 25px;
            border-radius: 10px;
            border-right: 5px solid #4f46e5;
          }
          .topics h4 { 
            margin-bottom: 15px; 
            color: #4f46e5;
            font-size: 18px;
            border-bottom: 2px solid #4f46e5;
            padding-bottom: 5px;
          }
          .topic-badge { 
            display: inline-block; 
            background: linear-gradient(45deg, #4f46e5, #667eea); 
            color: white;
            padding: 8px 12px; 
            margin: 4px; 
            border-radius: 8px; 
            font-size: 14px; 
            font-weight: 500;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .course-icon {
            font-size: 80px; 
            margin-bottom: 15px;
            filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.1));
          }
          .completion-date {
            font-size: 18px;
            color: #2c3e50;
            font-weight: 600;
          }
          .signature-section { 
            margin-top: 60px; 
            display: grid; 
            grid-template-columns: 1fr 1fr 1fr; 
            gap: 40px;
            border-top: 3px solid #4f46e5;
            padding-top: 30px;
          }
          .signature { 
            text-align: center;
            padding: 20px;
          }
          .signature-line {
            border-bottom: 3px solid #4f46e5; 
            width: 100%; 
            padding-bottom: 8px; 
            margin-bottom: 10px;
            font-weight: bold;
            font-size: 16px;
            color: #4f46e5;
          }
          .signature-title {
            font-size: 14px;
            color: #666;
            font-style: italic;
          }
          .cert-id { 
            margin-top: 40px; 
            font-size: 14px; 
            color: #666; 
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #dee2e6;
          }
          .qr-placeholder {
            width: 80px;
            height: 80px;
            background: #f8f9fa;
            border: 2px solid #4f46e5;
            margin: 0 auto 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            font-size: 10px;
            color: #666;
          }
          @media print { 
            body { 
              margin: 0; 
              background: white !important;
            }
            .certificate {
              box-shadow: none;
              border-radius: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="certificate">
          <div class="content">
            <div class="header">
              <h1 class="title">CERTIFICATE OF COMPLETION</h1>
              <div class="subtitle">Educational Achievement Award</div>
            </div>

            <div class="recipient">
              <div class="subtitle">This is to certify that</div>
              <div class="student-name">${studentName.toUpperCase()}</div>
              <div class="subtitle">has successfully completed the comprehensive course</div>
              <div class="course-title">"${course.title}"</div>
              <div class="subtitle">and has demonstrated mastery of all required competencies</div>
            </div>

            <div class="details">
              <div class="topics">
                <h4>📚 Course Topics Mastered</h4>
                ${course.topics.map(topic => `<span class="topic-badge">${topic}</span>`).join('')}
                <div style="margin-top: 15px; font-size: 14px; color: #666; font-style: italic;">
                  ${course.topics.length} comprehensive modules completed
                </div>
              </div>
              <div class="completion-info">
                <div class="course-icon">${course.icon}</div>
                <div class="completion-date">
                  <strong>Completed on</strong><br>
                  ${currentDate}
                </div>
                <div class="qr-placeholder">
                  QR CODE
                </div>
                <div style="font-size: 12px; color: #666;">Scan for verification</div>
              </div>
            </div>

            <div class="signature-section">
              <div class="signature">
                <div class="signature-line">VLearn</div>
                <div class="signature-title">Learning Platform</div>
              </div>
              <div class="signature">
                <div class="signature-line">Academic Director</div>
                <div class="signature-title">Course Certification</div>
              </div>
              <div class="signature">
                <div class="signature-line">Date Issued</div>
                <div class="signature-title">${currentDate}</div>
              </div>
            </div>

            <div class="cert-id">
              <strong>Certificate ID:</strong> ${course.id.slice(0, 8).toUpperCase()}-${Date.now()}<br>
              <strong>Verification URL:</strong> vlearn.pro/verify/${course.id.slice(0, 8)}<br>
              <small>This certificate can be independently verified through our online verification system</small>
            </div>
          </div>
        </div>

        <script>
          // Auto-print when opened
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 500);
          }
        </script>
      </body>
      </html>
    `

    // Create and download the certificate
    const blob = new Blob([certificateHTML], { type: 'text/html' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${course.title.replace(/[^a-zA-Z0-9]/g, '_')}_Certificate.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    // Show success message with better instructions
    setTimeout(() => {
      alert(`🎉 Certificate downloaded successfully!

The HTML file has been saved to your Downloads folder.

To convert to PDF:
1. Open the downloaded HTML file in your browser
2. It will automatically open the print dialog
3. Choose "Save as PDF" as destination
4. Click Save

Your certificate is now ready to share or print!`)
    }, 500)
  }

  const handleShare = () => {
    // In a real app, this would share the certificate
    alert("Certificate sharing functionality would be implemented here")
  }

  if (!course.completed) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Certificate Not Available</h3>
          <p className="text-muted-foreground mb-4">Complete the course and pass the quiz to earn your certificate.</p>
          <Badge variant="outline">Course Progress: {course.progress}%</Badge>
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">
              Tip: You need to score at least 70% on the quiz to complete the course and unlock your certificate.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Certificate of Completion</h2>
        <p className="text-muted-foreground">Congratulations on completing {course.title}!</p>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardContent className="p-8">
          <div className="border-8 border-double border-primary/20 p-8 text-center bg-gradient-to-br from-background to-muted/20">
            <div className="mb-6">
              <h1 className="text-4xl font-bold text-primary mb-2">Certificate of Completion</h1>
              <div className="w-24 h-1 bg-primary mx-auto"></div>
            </div>

            <div className="mb-8">
              <p className="text-lg mb-4">This is to certify that</p>
              <h2 className="text-3xl font-bold text-primary mb-4">{studentName}</h2>
              <p className="text-lg mb-2">has successfully completed the course</p>
              <h3 className="text-2xl font-semibold mb-6">{course.title}</h3>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h4 className="font-semibold mb-2">Topics Covered:</h4>
                <div className="space-y-1">
                  {course.topics.map((topic, index) => (
                    <Badge key={index} variant="outline" className="mr-1 mb-1">
                      {topic}
                    </Badge>
                  ))}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Calendar className="h-5 w-5" />
                  <span>Completed on {currentDate}</span>
                </div>
                <div className="text-center">
                  <div className="w-32 h-32 mx-auto mb-2 bg-gradient-to-br from-primary/10 to-primary/30 rounded-full flex items-center justify-center">
                    <span className="text-4xl">{course.icon}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Course Badge</p>
                </div>
              </div>
            </div>

            <div className="border-t pt-6">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <div className="border-b-2 border-primary/30 pb-2 mb-2">
                    <p className="font-semibold">VLearn</p>
                  </div>
                  <p className="text-sm text-muted-foreground">Learning Platform</p>
                </div>
                <div>
                  <div className="border-b-2 border-primary/30 pb-2 mb-2">
                    <p className="font-semibold">
                      Certificate ID: {course.id.slice(0, 8)}-{Date.now()}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">Verification Code</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-center gap-4">
        <Button onClick={handleDownload} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Download Certificate
        </Button>
        <Button variant="outline" onClick={handleShare} className="flex items-center gap-2 bg-transparent">
          <Share2 className="h-4 w-4" />
          Share Certificate
        </Button>
      </div>
    </div>
  )
}