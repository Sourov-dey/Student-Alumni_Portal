// src/services/applicationStats.js
import Application from '../models/application.js';

export const getApplicationStats = async (jobIds) => {
  if (!jobIds || !jobIds.length) return {};
  
  // Convert single ID to array if needed
  const ids = Array.isArray(jobIds) ? jobIds : [jobIds];
  
  // Get counts for all jobs in one query
  const stats = await Application.aggregate([
    { $match: { job: { $in: ids.map(id => typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id) } } },
    { $group: { 
      _id: '$job',
      totalApplications: { $sum: 1 },
      statusCounts: { 
        $push: '$status'
      }
    }},
    { $project: {
      _id: 1,
      totalApplications: 1,
      statusBreakdown: {
        submitted: { 
          $size: { 
            $filter: { 
              input: '$statusCounts', 
              cond: { $eq: ['$$this', 'submitted'] } 
            }
          }
        },
        shortlisted: { 
          $size: { 
            $filter: { 
              input: '$statusCounts', 
              cond: { $eq: ['$$this', 'shortlisted'] } 
            }
          }
        },
        rejected: { 
          $size: { 
            $filter: { 
              input: '$statusCounts', 
              cond: { $eq: ['$$this', 'rejected'] } 
            }
          }
        },
        hired: { 
          $size: { 
            $filter: { 
              input: '$statusCounts', 
              cond: { $eq: ['$$this', 'hired'] } 
            }
          }
        }
      }
    }}
  ]);

  // Convert to map for easier lookup
  return stats.reduce((acc, stat) => {
    acc[stat._id.toString()] = {
      totalApplications: stat.totalApplications,
      statusBreakdown: stat.statusBreakdown
    };
    return acc;
  }, {});
};
