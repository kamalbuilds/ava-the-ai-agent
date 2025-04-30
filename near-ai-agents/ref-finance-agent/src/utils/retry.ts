/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param retries Maximum number of retries
 * @param delay Initial delay in milliseconds
 * @param errorMessage Custom error message
 * @returns Promise with the function result
 */
export async function retry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 500,
  errorMessage: string = 'Operation failed after multiple retries'
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) {
      throw new Error(`${errorMessage}: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    console.log(`Retrying operation, ${retries} attempts remaining...`);
    
    // Wait before retrying with exponential backoff
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Retry with exponential backoff
    return retry(fn, retries - 1, delay * 2, errorMessage);
  }
} 