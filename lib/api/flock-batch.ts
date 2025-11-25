const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://localhost:7190";

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

export async function getFlockBatches(userId?: string, farmId?: string): Promise<ApiResponse<FlockBatch[]>> {
  try {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (farmId) params.append('farmId', farmId);
    
    const url = `${API_BASE_URL}/api/MainFlockBatch?${params.toString()}`;
    console.log("[v0] Fetching flock batches:", url);

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      mode: 'cors',
    });

    console.log("[v0] Flock batches response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[v0] Flock batches fetch error:", errorText);
      return {
        success: false,
        message: "Failed to fetch flock batches",
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
  
      const url = `${API_BASE_URL}/api/MainFlockBatch/${batchId}?${params.toString()}`;
      console.log("[v0] Deleting flock batch:", url);
  
      const response = await fetch(url, {
        method: "DELETE",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        mode: 'cors',
      });
  
      console.log("[v0] Flock batch delete response status:", response.status);
  
      if (!response.ok) {
        const errorText = await response.text();
        console.error("[v0] Flock batch delete error:", errorText);
        return {
          success: false,
          message: "Failed to delete flock batch",
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
    const url = `${API_BASE_URL}/api/MainFlockBatch`;
    console.log("[v0] Creating flock batch:", url, flockBatch);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      mode: 'cors',
      body: JSON.stringify(flockBatch),
    });

    console.log("[v0] Flock batch creation response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[v0] Flock batch creation error:", errorText);
      return {
        success: false,
        message: "Failed to create flock batch",
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
    
        const url = `${API_BASE_URL}/api/MainFlockBatch/${id}?${params.toString()}`;
        console.log("[v0] Fetching flock batch:", url);
    
        const response = await fetch(url, {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          mode: 'cors',
        });
    
        console.log("[v0] Flock batch fetch response status:", response.status);
    
        if (!response.ok) {
          const errorText = await response.text();
          console.error("[v0] Flock batch fetch error:", errorText);
          return {
            success: false,
            message: "Failed to fetch flock batch",
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
        const url = `${API_BASE_URL}/api/MainFlockBatch/${id}`;
        console.log("[v0] Updating flock batch:", url, flockBatch);
    
        const response = await fetch(url, {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          mode: 'cors',
          body: JSON.stringify(flockBatch),
        });
    
        console.log("[v0] Flock batch update response status:", response.status);
    
        if (!response.ok) {
          const errorText = await response.text();
          console.error("[v0] Flock batch update error:", errorText);
          return {
            success: false,
            message: "Failed to update flock batch",
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
    