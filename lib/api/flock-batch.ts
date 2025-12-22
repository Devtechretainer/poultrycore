import { buildApiUrl, getAuthHeaders } from './config'

export interface FlockBatch {
  batchId: number;
  farmId: string;
  userId: string;
  batchCode: string;
  batchName: string;
  breed: string;
  numberOfBirds: number;
  startDate: string;
  status: string;
  createdDate: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: string[];
}

// Helper function to extract error message from response
async function getErrorMessage(response: Response, defaultMessage: string): Promise<string> {
  try {
    const errorData = await response.json()
    // Check if we got meaningful error data
    if (errorData && typeof errorData === 'object') {
      // Try to extract message from various possible fields
      const message = errorData.message || errorData.error || errorData.Message || errorData.Error
      if (message) return message
      
      // If it's not an empty object, try to extract raw text
      if (errorData.raw) return errorData.raw
      
      // If object has keys but no message, include status info
      const keys = Object.keys(errorData)
      if (keys.length > 0) {
        return `${defaultMessage} (Status: ${response.status})`
      }
    }
    // Empty object or no meaningful data
    return `${defaultMessage} (Status: ${response.status} ${response.statusText})`
  } catch {
    try {
      const errorText = await response.text()
      if (errorText && errorText.trim()) {
        return errorText
      }
      return `${defaultMessage} (Status: ${response.status} ${response.statusText})`
    } catch {
      return `${defaultMessage} (Status: ${response.status} ${response.statusText})`
    }
  }
}

export async function getFlockBatches(userId?: string, farmId?: string): Promise<ApiResponse<FlockBatch[]>> {
  try {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (farmId) params.append('farmId', farmId);
    
    const url = `${buildApiUrl('/api/MainFlockBatch')}?${params.toString()}`;
    console.log("[v0] Fetching flock batches:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    console.log("[v0] Flock batches response status:", response.status);

    if (!response.ok) {
      const errorMessage = await getErrorMessage(response, "Failed to fetch flock batches");
      console.error("[v0] Flock batches fetch error:", errorMessage);
      return {
        success: false,
        message: errorMessage,
        data: [],
      };
    }

    const data = await response.json();
    console.log("[v0] Flock batches data received:", data);

    return {
      success: true,
      message: "Flock batches fetched successfully",
      data: data as FlockBatch[],
    };
    } catch (error) {
      console.error("[v0] Flock batches fetch error:", error);
      return {
        success: false,
        message: "Failed to fetch flock batches",
        data: [],
      };
    }
  }
  
  export async function deleteFlockBatch(batchId: number, userId: string, farmId: string): Promise<ApiResponse> {
    try {
      const params = new URLSearchParams();
      params.append('userId', userId);
      params.append('farmId', farmId);
  
      const url = `${buildApiUrl(`/api/MainFlockBatch/${batchId}`)}?${params.toString()}`;
      console.log("[v0] Deleting flock batch:", url);
  
      const response = await fetch(url, {
        method: "DELETE",
        headers: getAuthHeaders(),
      });
  
      console.log("[v0] Flock batch delete response status:", response.status);
  
      if (!response.ok) {
        const errorMessage = await getErrorMessage(response, "Failed to delete flock batch");
        console.error("[v0] Flock batch delete error:", errorMessage);
        return {
          success: false,
          message: errorMessage,
        };
      }
  
      return {
        success: true,
        message: "Flock batch deleted successfully",
      };
    } catch (error) {
      console.error("[v0] Flock batch delete error:", error);
      return {
        success: false,
        message: "Failed to delete flock batch",
      };
    }
  }

export interface FlockBatchInput {
  farmId: string;
  userId: string;
  batchName: string;
  batchCode: string;
  startDate: string;
  breed: string;
  numberOfBirds: number;
}

export async function createFlockBatch(flockBatch: FlockBatchInput): Promise<ApiResponse<FlockBatch>> {
  try {
    const url = buildApiUrl('/api/MainFlockBatch');
    console.log("[v0] Creating flock batch:", url, flockBatch);

    const response = await fetch(url, {
      method: "POST",
      headers: getAuthHeaders(),
      body: JSON.stringify(flockBatch),
    });

    console.log("[v0] Flock batch creation response status:", response.status);

    if (!response.ok) {
      const errorMessage = await getErrorMessage(response, "Failed to create flock batch");
      console.error("[v0] Flock batch creation error:", errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    }

    const data = await response.json();
    console.log("[v0] Flock batch created successfully:", data);

    return {
      success: true,
      message: "Flock batch created successfully",
      data: data as FlockBatch,
    };
  } catch (error) {
    console.error("[v0] Flock batch creation error:", error);
        return {
          success: false,
          message: "Failed to create flock batch",
        };
      }
    }
    
    export async function getFlockBatch(id: number, userId: string, farmId: string): Promise<ApiResponse<FlockBatch>> {
      try {
        const params = new URLSearchParams();
        params.append('userId', userId);
        params.append('farmId', farmId);
    
        const url = `${buildApiUrl(`/api/MainFlockBatch/${id}`)}?${params.toString()}`;
        console.log("[v0] Fetching flock batch:", url);
    
        const response = await fetch(url, {
          method: "GET",
          headers: getAuthHeaders(),
        });
    
        console.log("[v0] Flock batch fetch response status:", response.status);
    
        if (!response.ok) {
          const errorMessage = await getErrorMessage(response, "Failed to fetch flock batch");
          console.error("[v0] Flock batch fetch error:", errorMessage);
          return {
            success: false,
            message: errorMessage,
          };
        }
    
        const data = await response.json();
        console.log("[v0] Flock batch data received:", data);
    
        return {
          success: true,
          message: "Flock batch fetched successfully",
          data: data as FlockBatch,
        };
      } catch (error) {
        console.error("[v0] Flock batch fetch error:", error);
        return {
          success: false,
          message: "Failed to fetch flock batch",
        };
      }
    }
    
    export async function updateFlockBatch(id: number, flockBatch: Partial<FlockBatchInput>): Promise<ApiResponse> {
      try {
        const url = buildApiUrl(`/api/MainFlockBatch/${id}`);
        console.log("[v0] Updating flock batch:", url, flockBatch);
    
        const response = await fetch(url, {
          method: "PUT",
          headers: getAuthHeaders(),
          body: JSON.stringify(flockBatch),
        });
    
        console.log("[v0] Flock batch update response status:", response.status);
    
        if (!response.ok) {
          const errorMessage = await getErrorMessage(response, "Failed to update flock batch");
          console.error("[v0] Flock batch update error:", errorMessage);
          return {
            success: false,
            message: errorMessage,
          };
        }
    
        return {
          success: true,
          message: "Flock batch updated successfully",
        };
      } catch (error) {
        console.error("[v0] Flock batch update error:", error);
        return {
          success: false,
          message: "Failed to update flock batch",
        };
      }
    }
    