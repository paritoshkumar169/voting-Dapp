"use client"

import type React from "react"

import { useState } from "react"
import { useWallet } from "@solana/wallet-adapter-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCreateProposal } from "../hooks/use-create-proposal"
import { GOVERNANCE_MAX_OPTIONS } from "../types"
import { TrashIcon } from "lucide-react"

export function CreateProposal() {
  const { connected } = useWallet()
  const { createProposal, isLoading: govLoading } = useCreateProposal()

  const [heading, setHeading] = useState("")
  const [description, setDescription] = useState("")
  const [options, setOptions] = useState<string[]>(["Yes", "No"])
  const [newOption, setNewOption] = useState("")

  const handleAddOption = () => {
    if (newOption.trim() && options.length < GOVERNANCE_MAX_OPTIONS) {
      setOptions([...options, newOption.trim()])
      setNewOption("")
    }
  }

  const handleRemoveOption = (indexToRemove: number) => {
    if (options.length > 1) {
      setOptions(options.filter((_, i) => i !== indexToRemove))
    }
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!heading.trim() || !description.trim() || options.length === 0 || options.length > GOVERNANCE_MAX_OPTIONS) {
      console.error("Invalid proposal data")
      return
    }

    const signature = await createProposal({ heading, description, options })
    if (signature) {
      setHeading("")
      setDescription("")
      setOptions(["Yes", "No"])
      setNewOption("")
    }
  }

  if (!connected) {
    return (
      <Card className="bg-[#1e1e1e] border-[#333]">
        <CardContent className="pt-6">
          <p className="text-center text-gray-400">Please connect your wallet to create proposals</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-[#1e1e1e] border-[#333]">
      <CardHeader>
        <CardTitle>Create Proposal</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="heading" className="text-gray-300">
              Heading
            </Label>
            <Input
              id="heading"
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              placeholder="Proposal Title"
              required
              maxLength={64}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-gray-300">
              Description
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your proposal..."
              required
              maxLength={512}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 min-h-[100px]"
            />
          </div>

          <div>
            <Label className="text-gray-300">Options (1-{GOVERNANCE_MAX_OPTIONS})</Label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input value={option} readOnly className="bg-gray-800 border-gray-700 text-gray-300 flex-grow" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => handleRemoveOption(index)}
                    disabled={options.length <= 1}
                    aria-label={`Remove option ${option}`}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {options.length < GOVERNANCE_MAX_OPTIONS && (
              <div className="flex items-center space-x-2 mt-2">
                <Input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="Add another option..."
                  maxLength={64}
                  className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                />
                <Button type="button" onClick={handleAddOption} disabled={!newOption.trim()}>
                  Add
                </Button>
              </div>
            )}
            {options.length >= GOVERNANCE_MAX_OPTIONS && (
              <p className="text-xs text-gray-500 mt-1">Maximum options reached.</p>
            )}
          </div>

          <Button type="submit" disabled={govLoading} className="w-full">
            {govLoading ? "Creating Proposal…" : "Create Proposal"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
