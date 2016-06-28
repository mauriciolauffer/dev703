# dev703
SAP TechEd 2016: Code Review; Migrating Applications to HDI/XSA
In this code review session we will look at some common patterns in development based on the classic model of SAP HANA extended application services and on the repository in the SAP HANA platform, and see how to convert them to the deployment infrastructure for SAP HANA (aka HDI) and the advanced model of SAP HANA extended application services. We will focus on frequent issues that arise and how to avoid them. We will also look at using the XSJS compatibility layer within Node.js.

Migration: More than just a repository change
Migration is a multi-step process
•	Convert modeled views to Calculation Views within the current repository
•	Migrate all design time artifacts from the HANA Repository to Git
•	Convert database artifacts to new HDI syntax and file extensions
•	Deploy database artifacts via HDI into Containers
•	Adjust security for HDI container concepts
•	Adjust consumption for HDI container concept
•	Convert XS layer artifacts to XSA (Node.js and XSJS compatibility adjustments)
•	Deploy XS artifacts as micro services

