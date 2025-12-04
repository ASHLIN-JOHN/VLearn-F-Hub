
"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, Trophy, BookOpen, Users, Edit, Save, X } from "lucide-react"
import { useAuth } from "./auth-provider"

export function ProfileModule() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [editForm, setEditForm] = useState({
    name: "",
    bio: "",
    skillLevel: "",
    preferredSubjects: [] as string[]
  })
  const [newSubject, setNewSubject] = useState("")

  useEffect(() => {
    if (user) {
      setEditForm({
        name: user.name,
        bio: user.profile?.bio || "",
        skillLevel: user.profile?.skillLevel || "Beginner",
        preferredSubjects: user.profile?.preferredSubjects || []
      })
    }
  }, [user])

  const handleSave = () => {
    if (!user) return

    const updatedUser = {
      ...user,
      name: editForm.name,
      profile: {
        ...user.profile,
        bio: editForm.bio,
        skillLevel: editForm.skillLevel,
        preferredSubjects: editForm.preferredSubjects
      }
    }

    // Update local storage
    localStorage.setItem("local-user", JSON.stringify(updatedUser))
    
    // Update all users collection
    const allUsers = JSON.parse(localStorage.getItem("all-users") || "[]")
    const userIndex = allUsers.findIndex((u: any) => u.id === user.id)
    if (userIndex !== -1) {
      allUsers[userIndex] = updatedUser
      localStorage.setItem("all-users", JSON.stringify(allUsers))
    }

    setIsEditing(false)
    window.location.reload() // Refresh to show updated data
  }

  const addSubject = () => {
    if (newSubject.trim() && !editForm.preferredSubjects.includes(newSubject.trim())) {
      setEditForm(prev => ({
        ...prev,
        preferredSubjects: [...prev.preferredSubjects, newSubject.trim()]
      }))
      setNewSubject("")
    }
  }

  const removeSubject = (subject: string) => {
    setEditForm(prev => ({
      ...prev,
      preferredSubjects: prev.preferredSubjects.filter(s => s !== subject)
    }))
  }

  if (!user) return null

  const joinDate = user.profile?.joinDate ? new Date(user.profile.joinDate).toLocaleDateString() : "N/A"
  const certificates = user.profile?.certificatesEarned || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Student Profile</h1>
          <p className="text-muted-foreground">Manage your learning profile and view achievements</p>
        </div>
        <Button
          onClick={() => isEditing ? handleSave() : setIsEditing(true)}
          className="flex items-center gap-2"
        >
          {isEditing ? (
            <>
              <Save className="h-4 w-4" />
              Save Changes
            </>
          ) : (
            <>
              <Edit className="h-4 w-4" />
              Edit Profile
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardHeader>
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-24 w-24">
                <AvatarImage src="/placeholder-user.jpg" />
                <AvatarFallback className="text-2xl">
                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {isEditing ? (
                <Input
                  value={editForm.name}
                  onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                  className="text-center font-semibold"
                />
              ) : (
                <h2 className="text-xl font-semibold">{user.name}</h2>
              )}
              
              <p className="text-muted-foreground">{user.email}</p>
              
              <div className="text-center space-y-2">
                <div className="flex items-center gap-2 justify-center">
                  <Calendar className="h-4 w-4" />
                  <span className="text-sm">Joined {joinDate}</span>
                </div>
                
                {isEditing ? (
                  <select
                    value={editForm.skillLevel}
                    onChange={(e) => setEditForm(prev => ({ ...prev, skillLevel: e.target.value }))}
                    className="w-full p-2 border rounded"
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                    <option value="Expert">Expert</option>
                  </select>
                ) : (
                  <Badge variant="secondary">{user.profile?.skillLevel}</Badge>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Bio</Label>
                {isEditing ? (
                  <Textarea
                    value={editForm.bio}
                    onChange={(e) => setEditForm(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                    className="mt-1"
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {user.profile?.bio || "No bio added yet"}
                  </p>
                )}
              </div>

              <div>
                <Label>Preferred Subjects</Label>
                {isEditing && (
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={newSubject}
                      onChange={(e) => setNewSubject(e.target.value)}
                      placeholder="Add subject"
                      onKeyPress={(e) => e.key === 'Enter' && addSubject()}
                    />
                    <Button size="sm" onClick={addSubject}>Add</Button>
                  </div>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  {editForm.preferredSubjects.map((subject) => (
                    <Badge key={subject} variant="outline" className="text-xs">
                      {subject}
                      {isEditing && (
                        <X
                          className="h-3 w-3 ml-1 cursor-pointer"
                          onClick={() => removeSubject(subject)}
                        />
                      )}
                    </Badge>
                  ))}
                  {editForm.preferredSubjects.length === 0 && !isEditing && (
                    <p className="text-sm text-muted-foreground">No subjects selected</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats and Achievements */}
        <div className="md:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Courses Completed</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.profile?.coursesCompleted || 0}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Certificates Earned</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{certificates.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Friends</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.profile?.friends?.length || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Certificates */}
          <Card>
            <CardHeader>
              <CardTitle>My Certificates</CardTitle>
              <CardDescription>Your learning achievements and certifications</CardDescription>
            </CardHeader>
            <CardContent>
              {certificates.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No certificates earned yet</p>
                  <p className="text-sm text-muted-foreground">Complete courses to earn certificates!</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {certificates.map((cert: any, index: number) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <Trophy className="h-6 w-6 text-yellow-500" />
                          <Badge variant="secondary">Certified</Badge>
                        </div>
                        <CardTitle className="text-lg">{cert.courseTitle}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <p>Completed: {new Date(cert.completedDate).toLocaleDateString()}</p>
                          <p>Certificate ID: {cert.certificateId}</p>
                          {cert.downloadedAt && (
                            <p>Downloaded: {new Date(cert.downloadedAt).toLocaleDateString()}</p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {isEditing && (
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsEditing(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Changes
          </Button>
        </div>
      )}
    </div>
  )
}
