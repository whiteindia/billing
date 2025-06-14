
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from "sonner";

interface Project {
  id: string;
  name: string;
  status: string;
  client_id: string;
  client_name: string;
  service: string;
  project_amount: number | null;
}
interface Task {
  id: string;
  name: string;
  hours: number;
  hourly_rate: number;
}
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  availableTasks: Task[];
  services: any[];
  selectedProjectBillingType: string | null;
  selectedProjectAmount: number | null;
  hasOperationAccess: (entity: string, operation: string) => boolean;
  newInvoice: {
    project_id: string;
    selectedTasks: string[];
    description: string;
  };
  setNewInvoice: React.Dispatch<React.SetStateAction<{ project_id: string; selectedTasks: string[]; description: string }>>;
  handleProjectChange: (projectId: string) => void;
  handleCreateInvoice: () => void;
  handleTaskSelection: (taskId: string, checked: boolean) => void;
  createInvoiceMutationPending: boolean;
}

const InvoiceCreateDialog: React.FC<Props> = ({
  open, onOpenChange, projects, availableTasks, services,
  selectedProjectBillingType, selectedProjectAmount,
  hasOperationAccess, newInvoice, setNewInvoice,
  handleProjectChange, handleCreateInvoice, handleTaskSelection,
  createInvoiceMutationPending
}) => {
  // Get selected tasks info
  const getSelectedTasksTotal = () => {
    const selectedTasks = availableTasks.filter(task => 
      newInvoice.selectedTasks.includes(task.id)
    );
    const totalHours = selectedTasks.reduce((sum, task) => sum + task.hours, 0);
    const rate = selectedTasks[0]?.hourly_rate || 0;
    const totalAmount = totalHours * rate;
    return { totalHours, totalAmount };
  };

  // Debug: Log the current state
  console.log('InvoiceCreateDialog - selectedProjectBillingType:', selectedProjectBillingType);
  console.log('InvoiceCreateDialog - newInvoice.project_id:', newInvoice.project_id);
  console.log('InvoiceCreateDialog - availableTasks:', availableTasks);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto whitespace-nowrap">
          Create Invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Invoice</DialogTitle>
          <DialogDescription>
            {selectedProjectBillingType === 'Fixed'
              ? 'For Fixed price projects, an invoice will be generated instantly on project selection.'
              : selectedProjectBillingType === 'Hourly'
                ? 'For Hourly projects, select tasks to include in this invoice.'
                : 'Please select a project to see billing type.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Project Selection */}
          <div className="space-y-2">
            <Label htmlFor="project">Project</Label>
            <Select value={newInvoice.project_id} onValueChange={handleProjectChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a project" />
              </SelectTrigger>
              <SelectContent>
                {projects.length === 0 ? (
                  <SelectItem value="no-projects" disabled>
                    No active projects available
                  </SelectItem>
                ) : (
                  projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name} ({project.client_name || 'N/A'}) [{project.service}]
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Debug Information */}
          {newInvoice.project_id && (
            <div className="bg-blue-50 p-3 rounded text-sm">
              <strong>Debug Info:</strong>
              <br />
              Selected Project ID: {newInvoice.project_id}
              <br />
              Billing Type: {selectedProjectBillingType || 'Not set'}
              <br />
              Project Amount: {selectedProjectAmount ? `₹${selectedProjectAmount}` : 'Not set'}
            </div>
          )}

          {/* Show content for any selected project */}
          {newInvoice.project_id && (
            <>
              {/* Hourly Projects */}
              {selectedProjectBillingType === 'Hourly' && (
                <>
                  <div className="space-y-2">
                    <Label>Select Tasks to Invoice</Label>
                    <div className="border rounded-lg p-4 max-h-60 overflow-y-auto">
                      {availableTasks.length === 0 ? (
                        <p className="text-gray-500 text-sm">No completed tasks available for this project.</p>
                      ) : (
                        <div className="space-y-3">
                          {availableTasks.map((task) => (
                            <div key={task.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                              <Checkbox
                                id={`task-${task.id}`}
                                checked={newInvoice.selectedTasks.includes(task.id)}
                                onCheckedChange={(checked) => handleTaskSelection(task.id, checked as boolean)}
                              />
                              <div className="flex-1">
                                <label htmlFor={`task-${task.id}`} className="text-sm font-medium cursor-pointer">
                                  {task.name}
                                </label>
                                <div className="text-xs text-gray-600">
                                  {task.hours}h × ₹{task.hourly_rate}/hr = ₹{(task.hours * task.hourly_rate).toFixed(2)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {newInvoice.selectedTasks.length > 0 && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total Hours:</span>
                          <span className="text-lg font-bold">
                            {getSelectedTasksTotal().totalHours.toFixed(2)}h
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total Amount:</span>
                          <span className="text-2xl font-bold text-green-600">
                            ₹{getSelectedTasksTotal().totalAmount.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  <Button 
                    onClick={handleCreateInvoice} 
                    className="w-full"
                    disabled={newInvoice.selectedTasks.length === 0 || createInvoiceMutationPending}
                  >
                    {createInvoiceMutationPending ? 'Creating...' : 'Create Invoice'}
                  </Button>
                </>
              )}

              {/* Fixed Projects */}
              {selectedProjectBillingType === 'Fixed' && (
                <div className="bg-gray-50 rounded-lg p-4 flex flex-col space-y-2">
                  <span>
                    <b>Project Type:</b> Fixed Price
                  </span>
                  <span>
                    <b>Invoice Amount:</b> ₹{selectedProjectAmount ? selectedProjectAmount.toFixed(2) : 'N/A'}
                  </span>
                  <span className="text-sm text-gray-500">
                    Invoice was generated instantly for this project.
                  </span>
                </div>
              )}

              {/* Unknown billing type or other services */}
              {selectedProjectBillingType && selectedProjectBillingType !== 'Fixed' && selectedProjectBillingType !== 'Hourly' && (
                <div className="bg-yellow-50 text-yellow-800 rounded p-3 text-sm">
                  <strong>Service Type:</strong> {selectedProjectBillingType}
                  <br />
                  This service type is not yet supported for invoice creation.
                </div>
              )}

              {/* No billing type determined */}
              {!selectedProjectBillingType && (
                <div className="bg-red-50 text-red-600 rounded p-3 text-sm font-medium">
                  Error: Could not determine project billing type.
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceCreateDialog;
